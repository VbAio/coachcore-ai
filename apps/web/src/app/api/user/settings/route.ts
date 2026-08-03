import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import {
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
} from '@/lib/auth/validation';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { isUsernameAvailable, isEmailAvailable, sanitizePublicUser } from '@/lib/auth/user-service';
import { generateToken, tokenExpiresHours } from '@/lib/auth/tokens';
import { sendEmailChangeConfirmation } from '@/lib/auth/email';

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === 'changePassword') {
      const parsed = changePasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user?.passwordHash) {
        return NextResponse.json({ error: 'Password login not configured' }, { status: 400 });
      }

      const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
      }

      const passwordHash = await hashPassword(parsed.data.newPassword);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
      return NextResponse.json({ success: true, message: 'Password updated' });
    }

    if (action === 'changeEmail') {
      const parsed = changeEmailSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!user?.passwordHash) {
        return NextResponse.json({ error: 'Verify identity with password first' }, { status: 400 });
      }

      const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
      }

      const newEmail = parsed.data.newEmail.toLowerCase();
      if (!(await isEmailAvailable(newEmail))) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }

      await prisma.verificationToken.deleteMany({ where: { identifier: newEmail } });
      const token = generateToken();
      await prisma.verificationToken.create({
        data: { identifier: newEmail, token, expires: tokenExpiresHours(24) },
      });
      await sendEmailChangeConfirmation(newEmail, token);

      return NextResponse.json({
        success: true,
        message: 'Confirmation email sent to new address',
      });
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const data = parsed.data;
    if (data.username) {
      const normalized = data.username.toLowerCase();
      const current = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (current && current.username !== normalized && !(await isUsernameAvailable(normalized))) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
      data.username = normalized;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username: data.username,
        displayName: data.displayName,
        avatar: data.avatar,
        name: data.displayName,
        image: data.avatar,
        language: data.language,
        theme: data.theme,
        timezone: data.timezone,
        notificationPreferences: body.notificationPreferences,
        preferences: body.preferences,
        savedHeroes: body.savedHeroes,
        savedMatches: body.savedMatches,
        favoriteHeroes: body.favoriteHeroes,
        favoriteItems: body.favoriteItems,
        settings: body.settings,
      },
    });

    return NextResponse.json({ user: sanitizePublicUser(user) });
  } catch (err) {
    console.error('[settings]', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const password = body.password as string | undefined;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: 'Password required to delete account' }, { status: 400 });
      }
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
      }
    }

    await prisma.user.delete({ where: { id: user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[delete-account]', err);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
