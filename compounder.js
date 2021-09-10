require('dotenv').config()

const ethers = require('ethers')

CONTRACTS_ADDRS = require('./contracts-addrs')
NYAN_REWARDS_ABI = require('./abis/nyan-rewards')
NYAN_TOKEN_ABI = require('./abis/nyan-token')

const { ARB_ONE_URL, PRIVATE_KEY } = process.env

const provider = new ethers.providers.JsonRpcProvider(ARB_ONE_URL)
const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
const account = wallet.address

const nyanRewards = new ethers.Contract(
    CONTRACTS_ADDRS.nyanRewards, NYAN_REWARDS_ABI, provider
)
const nyanToken = new ethers.Contract(
    CONTRACTS_ADDRS.nyanToken, NYAN_TOKEN_ABI, provider
)

const delay = ms => new Promise(res => setTimeout(res, ms))

const compoundNyanStaking = async (minimumEarned = 0, minimumGasBalance = 0) => {
    const ethBalance = await provider.getBalance(account)
    console.log('ethBalance: ',
        (ethBalance/1e18).toString(),
        'ETH'
    )
    if (ethBalance < minimumGasBalance) {
        // do something
    }

    const stakingBalance = await nyanRewards.balanceOf(account)
    console.log('staking balance: ',
        (stakingBalance/1e18).toString(),
        'NYAN'
    )

    const earned = await nyanRewards.earned(account)
    console.log('earned: ',
        (earned/1e18).toString(),
        'NYAN'
    )
    if (earned < minimumEarned) {
        // do something
    }

    console.log('now claiming. . .')
    const claim = await nyanRewards.connect(wallet).getReward()
    console.log('claim tx can be viewed at: ',
        `https://arbiscan.io/tx/${claim.hash}`
    )
    const claimResult = await claim.wait()

    const nyanBalance = await nyanToken.balanceOf(account)

    console.log('now staking. . .')
    const stake = await nyanRewards.connect(wallet).stake(nyanBalance)
    console.log('stake tx can be viewed at: ',
        `https://arbiscan.io/tx/${stake.hash}`
    )
    const stakeResult = await stake.wait()

    // console.log('claim tx: ', claim)
    // console.log('result: ', claimResult)
    // console.log('stake tx: ', stake)
    // console.log('result: ', stakeResult)

    const newStakingBalance = await nyanRewards.balanceOf(account)

    console.log('new staking balance: ',
        (newStakingBalance/1e18).toString(),
        'NYAN'
    )
}


const main = async () => {
    const interval = 3600000 // 1 hour
    while (true) {
        await compoundNyanStaking()
        console.log(`now sleeping for: ${interval} ms`)
        await delay(interval)
    }
}

main()
