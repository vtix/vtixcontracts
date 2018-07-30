const SafeMathLibExt = artifacts.require("./SafeMathLibExt.sol");
const CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
const CrowdsaleTokenExtv1 = artifacts.require("./CrowdsaleTokenExtv1.sol");
const FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const NullFinalizeAgentExt = artifacts.require("./NullFinalizeAgentExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");
const Registry = artifacts.require("./Registry.sol");
const TokenVesting = artifacts.require("./TokenVesting.sol");

const constants = require("../test/constants");
const utils = require("../test/utils");

const tokenParams = [
  constants.token.name,
  constants.token.ticker,
  parseInt(constants.token.supply, 10),
  parseInt(constants.token.decimals, 10),
  constants.token.isMintable,
  constants.token.globalmincap,
  constants.token.oldtokenaddress,
  constants.token.originalSupply
];

let tokenVestingParams = [];

const pricingStrategyParams = [
  utils.toFixed(web3.toWei(1 / constants.pricingStrategy.rate1, "ether")),
  constants.pricingStrategy.rate1TokenMin,
  constants.pricingStrategy.rate1TokenMax,
  utils.toFixed(web3.toWei(1 / constants.pricingStrategy.rate2, "ether")),
  constants.pricingStrategy.rate2TokenMin,
  constants.pricingStrategy.rate2TokenMax,
  utils.toFixed(web3.toWei(1 / constants.pricingStrategy.rate3, "ether")),
  constants.pricingStrategy.rate3TokenMin,
  constants.pricingStrategy.rate3TokenMax,
  utils.toFixed(web3.toWei(1 / constants.pricingStrategy.rate4, "ether")),
  constants.pricingStrategy.rate4TokenMin,
  constants.pricingStrategy.rate4TokenMax,
  utils.toFixed(web3.toWei(1 / constants.pricingStrategy.rate5, "ether")),
  constants.pricingStrategy.rate5TokenMin
];

const crowdsaleParams = [
  constants.crowdsale.start,
  constants.crowdsale.end,
  constants.crowdsale.minimumFundingGoal,
  constants.crowdsale.maximumSellableTokens,
  constants.crowdsale.isUpdatable,
  constants.crowdsale.isWhiteListed
];

let reservedTokensFinalizeAgentParams = [];

module.exports = function (deployer) {
  deployer.deploy(SafeMathLibExt).then(async () => {

    await deployer.link(SafeMathLibExt, CrowdsaleTokenExtv1);
    await deployer.deploy(CrowdsaleTokenExtv1, ...tokenParams);

    await deployer.link(SafeMathLibExt, FlatPricingExt);
    await deployer.deploy(FlatPricingExt, ...pricingStrategyParams);

    tokenVestingParams.push(CrowdsaleTokenExtv1.address);
    await deployer.deploy(TokenVesting, ...tokenVestingParams);

    crowdsaleParams.unshift("0xc120cce87A5782162d407c70DCa0BaABb9448AB5");
    crowdsaleParams.unshift(FlatPricingExt.address);
    crowdsaleParams.unshift(CrowdsaleTokenExtv1.address);
    crowdsaleParams.unshift("Utix Crowdsale");
    crowdsaleParams.push(TokenVesting.address);

    await deployer.link(SafeMathLibExt, MintedTokenCappedCrowdsaleExt);
    await deployer.deploy(MintedTokenCappedCrowdsaleExt, ...crowdsaleParams);

    //nullFinalizeAgentParams.push(MintedTokenCappedCrowdsaleExt.address);
    reservedTokensFinalizeAgentParams.push(CrowdsaleTokenExtv1.address);
    reservedTokensFinalizeAgentParams.push(MintedTokenCappedCrowdsaleExt.address);

    //await deployer.link(SafeMathLibExt, NullFinalizeAgentExt);
    //await deployer.deploy(NullFinalizeAgentExt, ...nullFinalizeAgentParams);
    await deployer.link(SafeMathLibExt, ReservedTokensFinalizeAgent);
    await deployer.deploy(ReservedTokensFinalizeAgent, ...reservedTokensFinalizeAgentParams);

    //await deployer.deploy(Registry);

    let crowdsaleTokenExtv1 = await CrowdsaleTokenExtv1.deployed();

    await crowdsaleTokenExtv1.setReservedTokensListMultiple(
      ["0x29ecee763c34b0557c4d2b9472cc79df7f9634a9", "0x29b994a699ced9201c35f63d140e9421354c9ef5", "0x364150eA2DF38679AAFc61171019673fdA1e2107", "0xa16d91f31ac922fd0d8446573eccae932f7bd76c"],
      [constants.reservedTokens.number, constants.reservedTokens2.number, constants.reservedTokens3.number, constants.reservedTokens4.number],
      [constants.reservedTokens.percentageUnit, constants.reservedTokens2.percentageUnit, constants.reservedTokens3.percentageUnit, constants.reservedTokens4.percentageUnit],
      [constants.reservedTokens.percentageDecimals, constants.reservedTokens2.percentageDecimals, constants.reservedTokens3.percentageDecimals, constants.reservedTokens4.percentageDecimals]
    );

    let flatPricingExt = await FlatPricingExt.deployed();
    await flatPricingExt.setTier(MintedTokenCappedCrowdsaleExt.address);

    let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();

    await mintedTokenCappedCrowdsaleExt.updateJoinedCrowdsalesMultiple([MintedTokenCappedCrowdsaleExt.address]);

    await crowdsaleTokenExtv1.setMintAgent(MintedTokenCappedCrowdsaleExt.address, true);

    //await crowdsaleTokenExtv1.setMintAgent(NullFinalizeAgentExt.address, true);

    await crowdsaleTokenExtv1.setMintAgent(ReservedTokensFinalizeAgent.address, true);

    await mintedTokenCappedCrowdsaleExt.setEarlyParticipantWhitelistMultiple(
      ["0x3ea1bcc506d5c5a6db9f09d9faeb7e00e5a437a8", "0x35a3f7ba37ba6d8849367b2c4d59ddc466b92278"],
      [constants.whiteListItem.status, constants.whiteListItem.status],
      [constants.whiteListItem.minCap, constants.whiteListItem.minCap],
      [constants.whiteListItem.maxCap, constants.whiteListItem.maxCap]
    );

    await mintedTokenCappedCrowdsaleExt.setFinalizeAgent(ReservedTokensFinalizeAgent.address);

    await crowdsaleTokenExtv1.setReleaseAgent(ReservedTokensFinalizeAgent.address);

    await crowdsaleTokenExtv1.setReleaseAgent(ReservedTokensFinalizeAgent.address);

    //await CrowdsaleTokenExtv1.transferOwnership(ReservedTokensFinalizeAgent.address);
  });
};
