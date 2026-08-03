import { registerGame } from './registry';
import { deadlockModule } from './deadlock/config/navigation';
import { fortniteModule } from './fortnite/config/navigation';
import { valorantModule } from './valorant/config/navigation';
import {
  leagueModule,
  rocketLeagueModule,
  cs2Module,
  apexModule,
} from './stubs/coming-soon-games';

/** Single registration point — add new games here only */
export function registerAllGames(): void {
  registerGame(deadlockModule);
  registerGame(fortniteModule);
  registerGame(valorantModule);
  registerGame(leagueModule);
  registerGame(rocketLeagueModule);
  registerGame(cs2Module);
  registerGame(apexModule);
}

registerAllGames();

export * from './registry';
export * from './types';
