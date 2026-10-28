export function isSpendingConfirmed(env){
 return env.BURSYAR_SPENDING_CONFIRMED==='1'&&Number.isFinite(Number(env.BURSYAR_SPEND_LIMIT_USD))&&Number(env.BURSYAR_SPEND_LIMIT_USD)>0&&typeof env.BURSYAR_SPENDING_CONFIRMED_AT==='string'&&Number.isFinite(Date.parse(env.BURSYAR_SPENDING_CONFIRMED_AT));
}
