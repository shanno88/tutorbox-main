module.exports = {
  apps: [
    {
      name: 'tutorbox',
      script: 'npm',
      args: 'start',
      env: {
        NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD: 'pri_01khwk19y0af40zae5fnysj5t3',
        NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY: 'pri_01kggqdgjrgyryb19xs3veb1js',
        NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD: 'pri_01kgrhp2wtthebpgwmn8eh5ssy',
      },
    },
  ],
}
