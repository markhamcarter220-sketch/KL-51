
const { z } = require('zod');
module.exports = {
  // For CLV calculations both openOdds and closeOdds must be finite numbers
  clvSchema: z.object({
    openOdds: z.number().finite(),
    closeOdds: z.number().finite(),
  }),
  // Devig requires a non-empty array of finite probabilities
  devigSchema: z.object({
    probs: z.array(z.number()).nonempty(),
  }),
  // Arbitrage uses three finite numerical inputs
  arbSchema: z.object({
    p1: z.number().finite(),
    p2: z.number().finite(),
    p3: z.number().finite(),
  }),
};
