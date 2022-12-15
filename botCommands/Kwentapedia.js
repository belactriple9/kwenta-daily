// we're just going to put all the commands in here and export them

const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const ethers = require('ethers');

// const definitions = require('./definitions.json');

const optimism_rpc = "https://optimism-mainnet.public.blastapi.io";
const secondsPerYear = 31536000; // self explanatory
const stakingRewardsRatio = 60; // 60% of rewards go to stakers
const kwentaTokenAddress = "0x920Cf626a271321C151D027030D5d08aF699456b"; // self explanatory
const stakingAddress = "0x6e56A5D49F775BA08041e28030bc7826b13489e0"; // anything in here that isn't rewards is in circulation;
const tradingIncentivesAddress = "0xf486A72E8c8143ACd9F65A104A16990fDb38be14"; // anything not redeemed is not in circulation
const vKWENTARedemptionAddress = "0x8132EE584bCD6f8Eb1bea141DB7a7AC1E72917b9"; // anything not redeemed is not in circulation
const veKWENTARedemptionAddress = "0xc7088ac8f287539567e458c7d08c2a1470fd25b7"; // anything not redeeemd is not in circulation
const UnknownGnosisSafeAddress = "0xf510a2ff7e9dd7e18629137ada4eb56b9c13e885"; // kwenta team multisig
const RewardEscrowAddress = "0x1066a8eb3d90af0ad3f89839b974658577e75be2"; // lets users "stake" their veKWENTA to be allowed to claim rewards from 0x6e56a5d49f775ba08041e28030bc7826b13489e0; has a read only function "totalEscrowedBalance" to track the number of veKWENTA staked
const DAOTreasurySafeAddress = "0x82d2242257115351899894ef384f779b5ba8c695"; // this is where the fees go to, the DAO treasury. The fees are in sUSD. This is also where forfeit KWENTA goes when a user redeems their vKWENTA
const sUSDAddress = "0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9"; // self explanatory

const provider = new ethers.providers.JsonRpcProvider(optimism_rpc);


const getStakingRewardsAdded = async () => {
  const topic = ethers.utils.id("RewardAdded(uint256)");
  const rewardFilter = {
    // address: stakingAddress,
    topics: [topic]
  };
  // const rewardList = await provider.getLogs(rewardFilter); // not working??
  const rewardList = await fetch(`https://api-optimistic.etherscan.io/api?module=logs&action=getLogs&address=0x6e56A5D49F775BA08041e28030bc7826b13489e0&topic0=${topic}&page=1&apikey=YourApiKeyToken`)
  .then(response => response.json())
  .then(data => {return data.result});
  const sumRewards = rewardList.reduce((acc, reward) => {
    const rewardAmount = ethers.utils.defaultAbiCoder.decode(["uint256"], reward.data)[0];
    return acc.add(rewardAmount);
  }, ethers.BigNumber.from(0));

  return sumRewards;
};

const getTokenSupply = async () => {
  const tokenContract = new ethers.Contract(kwentaTokenAddress, ["function totalSupply() view returns (uint256)"], provider);
  const tokenSupply = await tokenContract.totalSupply();
  return ethers.BigNumber.from(tokenSupply);
};

const getBalanceOfStakingContract = async () => {
  const tokenContract = new ethers.Contract(kwentaTokenAddress, ["function balanceOf(address) view returns (uint256)"], provider);
  const balance = await tokenContract.balanceOf(stakingAddress);
  return ethers.BigNumber.from(balance);
};

const getEscrowedBalance = async () => {
  const escrowContract = new ethers.Contract(RewardEscrowAddress, ["function totalEscrowedBalance() view returns (uint256)"], provider);
  const balance = await escrowContract.totalEscrowedBalance();
  return ethers.BigNumber.from(balance);
};

/*
const getBurntKWENTA = async () => {
  const burnTopic = ethers.utils.id("Transfer(address,address,uint256)");
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const zeroAddressPadded = ethers.utils.hexZeroPad(zeroAddress, 32);
  const burnFilter = {
    address: kwentaTokenAddress,
    topics: [burnTopic, null, zeroAddressPadded]
  };
  // const burnList = await provider.getLogs(burnFilter);
  const burnList = await fetch(`https://api-optimistic.etherscan.io/api?module=logs&action=getLogs&address=${kwentaTokenAddress}&topic0=${burnTopic}&topic2=${zeroAddressPadded}&page=1&apikey=YourApiKeyToken`)
    .then(response => response.json())
    .then(data => {return data.result});
  console.log(burnList);
  const sumBurnt = burnList.reduce((acc, burn) => {
    const burnAmount = ethers.utils.defaultAbiCoder.decode(["uint256"], burn.data)[0];
    return acc.add(burnAmount);
  }, ethers.BigNumber.from(0));
  return sumBurnt;
}*/

const getForfeitKWENTA = async () => {
  const topic = ethers.utils.id("Transfer(address,address,uint256)");
  // we have defined the safe above, but we need to pad it to 32 bytes
  const safePadded = ethers.utils.hexZeroPad(DAOTreasurySafeAddress, 32);
  const escrowContractPadded = ethers.utils.hexZeroPad(RewardEscrowAddress, 32);
  const forfeitFilter = {
    address: kwentaTokenAddress,
    topics: [topic, escrowContractPadded, safePadded]
  };
  // const forfeitList = await provider.getLogs(forfeitFilter);
  const forfeitList = await fetch(`https://api-optimistic.etherscan.io/api?module=logs&action=getLogs&address=${kwentaTokenAddress}&topic0=${topic}&topic1=${escrowContractPadded}&topic2=${safePadded}&page=1&apikey=YourApiKeyToken`)
    .then(response => response.json())
    .then(data => {return data.result});
  const sumForfeits = forfeitList.reduce((acc, forfeit) => {
    const forfeitAmount = ethers.utils.defaultAbiCoder.decode(["uint256"], forfeit.data)[0];
    return acc.add(forfeitAmount);
  }, ethers.BigNumber.from(0));
  return sumForfeits;
}

const getBalanceOfvKwentaRedemptionContract = async () => {
  const tokenContract = new ethers.Contract(kwentaTokenAddress, ["function balanceOf(address) view returns (uint256)"], provider);
  const balance = await tokenContract.balanceOf(vKwentaRedemptionAddress);
  return ethers.BigNumber.from(balance);
};

const getBalanceOfveKwentaRedemptionContract = async () => {
  const tokenContract = new ethers.Contract(kwentaTokenAddress, ["function balanceOf(address) view returns (uint256)"], provider);
  const balance = await tokenContract.balanceOf(veKwentaRedemptionAddress);
  return ethers.BigNumber.from(balance);
};

const getBalanceOfTradingIncentiveContract = async () => {
  const tokenContract = new ethers.Contract(kwentaTokenAddress, ["function balanceOf(address) view returns (uint256)"], provider);
  const balance = await tokenContract.balanceOf(tradingIncentiveAddress);
  return ethers.BigNumber.from(balance);
};

const getRewardRate = async () => {
  const stakingContract = new ethers.Contract(stakingAddress, ["function rewardRate() view returns (uint256)"], provider);
  const rewardRate = await stakingContract.rewardRate();
  return ethers.BigNumber.from(rewardRate);
};

const getStakedTokensTotalSupply = async () => {
  const stakingContract = new ethers.Contract(stakingAddress, ["function totalSupply() view returns (uint256)"], provider);
  const totalSupply = await stakingContract.totalSupply();
  return ethers.BigNumber.from(totalSupply);
}

const searchDefinitions = async (searchItem) => {
    // the definitions constant is an object containing definitions
    /**
     * example of the definitions object
     * {
     *      "Definitions": [
     *           {
     *                "Name": "kwenta",
     *                "Definition: "the kwenta."
     *                "DefinitionExtended": "kwenta is real" // optional!
     *           },
     *           // put more definitions here...
     *      ]
     * }
     */

    // definition variable is already cached

    // stub
    return null;

}



// const rewards = await getStakingRewardsAdded(); // the total number of rewards distributed
// const tokenSupply = await getTokenSupply(); // the total supply of kwenta tokens if it's completely liquid
// const stakedPlusRewards = await getBalanceOfStakingContract(); // the blance of kwenta tokens in the staking contract
// const liquidKwentaStaked = stakedPlusRewards.sub(rewards); // the number of liquid kwenta tokens staked
// const trueStaked = await getStakedTokensTotalSupply(); //stakedPlusRewards.sub(rewards);
// const rewardRate = await getRewardRate(); // the rate at which rewards are being distributed per second
// const escrowedTokensCount = await getEscrowedBalance(); // overall number of escrowed tokens
// const totalEscrowedStaking = trueStaked.sub(liquidKwentaStaked); // the number of escrowed tokens eligible for staking rewards
// const APY = rewardRate.mul(secondsPerYear).mul(10000).div(trueStaked); // APY is the reward rate per year, multiplied by 10000 to get 2 decimal places
// const APYRateAdjusted = APY.mul(60).div(100); // we multiply by 60% to get the APY of the staking contract
// const percentStaked = trueStaked.mul(100).div(tokenSupply); // the percentage of the total supply that is staked
// const forfeitedKWENTA = await getForfeitKWENTA(); // the number of kwenta tokens forfeited by users who vest early


// stringifying the numbers
// const rewardString = ethers.utils.formatEther(rewards);
// const supplyString = ethers.utils.formatEther(tokenSupply);
// const trueStakedString = ethers.utils.formatEther(trueStaked);
// const percentStakedString = percentStaked.toString();
// const forfeitedKWENTAString = ethers.utils.formatEther(forfeitedKWENTA);
// const totalEscrowedStakingString = ethers.utils.formatEther(totalEscrowedStaking);
// const fixedAPYString = APYRateAdjusted.toString().substring(0, APYRateAdjusted.toString().length - 2) + "." + APYRateAdjusted.toString().substring(APYRateAdjusted.toString().length - 2, APYRateAdjusted.toString().length);


const getStakingAPY = async () => {
    const trueStaked = await getStakedTokensTotalSupply(); //stakedPlusRewards.sub(rewards);
    const rewardRate = await getRewardRate(); // the rate at which rewards are being distributed per second
    const APY = rewardRate.mul(secondsPerYear).mul(10000).div(trueStaked); // APY is the reward rate per year, multiplied by 10000 to get 2 decimal places
    const APYRateAdjusted = APY.mul(60).div(100); // we multiply by 60% to get the APY of the staking contract
    return APYRateAdjusted;
}



// document.getElementById("total-supply").innerHTML = supplyString.substring(0, supplyString.indexOf(".") + 3);
// document.getElementById("total-staked").innerHTML = trueStakedString.substring(0, trueStakedString.indexOf(".") + 3);
// document.getElementById("total-rewards-added").innerHTML = rewardString.substring(0, rewardString.indexOf(".") + 3);
// document.getElementById("percentage-staked").innerHTML = percentStakedString.substring(0, percentStakedString.indexOf(".") + 3) + "%";
// document.getElementById("total-burnt").innerHTML = forfeitedKWENTAString.substring(0, forfeitedKWENTAString.indexOf(".") + 3);
// document.getElementById("total-escrowed-staking").innerHTML = totalEscrowedStakingString.substring(0, totalEscrowedStakingString.indexOf(".") + 3);
// document.getElementById("reward-apy").innerHTML = fixedAPYString + "%";



module.exports = 
[
    {
        data: new SlashCommandBuilder().setName('totalsupply').setDescription('Request the total supply of $KWENTA'),
        async execute(interaction) {
            const supply = await getTokenSupply();
            const supplyString = ethers.utils.formatEther(supply);
            await interaction.reply(supplyString + " $KWENTA minted");
        }
    },
    // {
    //     data: new SlashCommandBuilder().setName('kwentapediasearch').setDescription('Search for a definition').addStringOption(option =>
    //         option.setName('search')
    //             .setDescription('Search item')
    //             .setRequired(true)).addStringOption(option => 
    //         option.setName('extended')
    //             .setDescription('Extended definition'
    //             .setRequired(false))),
    //     async execute(interaction) {
    //         // get the search item from the interaction
    //         const searchItem = interaction.options.getString('search');
    //         // get the extended definition from the interaction
    //         const extended = interaction.options.getString('extended');
    //         const getExtended = extended === "true" ? true : extended==="1" ? true : extended === "yes" ? true : false; // what in the ternerary is this

    //         // get the definitions
    //         const defs = await getDefinitions(searchItem);
    //         // if there's more than 1 definition we'll suggest them instead of just returning the first one
    //         if(defs.length > 1)
    //         {
    //             // we'll create an array of all the definitions names
    //             const defNames = defs.map(def => def.Name);
    //             await interaction.reply("Did you mean one of these? " + defNames.join(", "));
    //         }
    //         else if(defs.length === 1)
    //         {
    //             if(getExtended)
    //             {
    //                 await interaction.reply(defs[0].Definition + "\n" + defs[0].DefinitionExtended);
    //             }
    //         }
    //         await interaction.reply('An error occured: definition doesn\'t exist');
    //     }
    // },
    {
        data: new SlashCommandBuilder().setName('vestingforfeit').setDescription('Return the number of $KWENTA forfeited by users who vest early'),
        async execute(interaction) {
            const forfeitedKWENTA = await getForfeitKWENTA();
            const forfeitedKWENTAString = ethers.utils.formatEther(forfeitedKWENTA);
            const forfeitedKWENTADisplay = forfeitedKWENTAString.substring(0, forfeitedKWENTAString.indexOf(".") + 3);
            const forfeitedKWENTADisplayFormatted = forfeitedKWENTADisplay.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            await interaction.reply(forfeitedKWENTADisplayFormatted + " $KWENTA forfeited to the Treasury"); 
        }
    },
    {
        data: new SlashCommandBuilder().setName('totalstaked').setDescription('Return the total number of $KWENTA staked'),
        async execute(interaction) {
            const trueStaked = await getStakedTokensTotalSupply();
            const trueStakedString = ethers.utils.formatEther(trueStaked);
            const trueStakedDisplay = trueStakedString.substring(0, trueStakedString.indexOf(".") + 3);
            const trueStakedDisplayFormatted = trueStakedDisplay.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            await interaction.reply(trueStakedDisplayFormatted + " $KWENTA staked");
        }
    },
    {
        data: new SlashCommandBuilder().setName('totalstakingrewardsadded').setDescription('Return the total number of $KWENTA rewards added to the staking contract'),
        async execute(interaction) {
            const rewards = await getStakingRewardsAdded();
            const rewardsString = ethers.utils.formatEther(rewards);
            const rewardsDisplay = rewardsString.substring(0, rewardsString.indexOf(".") + 3);
            // format the number string with commas
            const rewardsDisplayFormatted = rewardsDisplay.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            await interaction.reply(rewardsDisplayFormatted + " $KWENTA rewards added to the staking contract");
        }
    },
    {
        data: new SlashCommandBuilder().setName('totalstakedpercentage').setDescription('Return the percentage of liquid and escrowed $KWENTA staked'),
        async execute(interaction) {
            const percentStaked = await getStakedTokensPercentage();
            const percentStakedString = percentStaked.toString();
            const percentStakedDisplay = percentStakedString.substring(0, percentStakedString.indexOf(".") + 3) + "%";
            await interaction.reply(percentStakedDisplay + " of $KWENTA staked");
        }
    },
    {
        data: new SlashCommandBuilder().setName('currentstakingapy').setDescription('Return the current $KWENTA staking APY'),
        async execute(interaction) {
            const APY = await getStakingAPY();
            const fixedAPYString = APY.toString().substring(0, APY.toString().length - 2) + "." + APY.toString().substring(APY.toString().length - 2, APY.toString().length);
            await interaction.reply(fixedAPYString + "% APY");
        }
    },

];