export interface CurrentRewards {
  round: number;
  network: string;
  fees: string;
  volume: string;
  merkle_root: string;
  start: number;
  end: number;
  rewards?: (RewardsEntity)[] | null;
}
export interface RewardsEntity {
  round: number;
  volume: string;
  network: string;
  user_address: string;
  reward: string;
  degen_reward: string;
}
