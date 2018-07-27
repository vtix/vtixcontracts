/**
 * This smart contract code is Copyright 2017 TokenMarket Ltd. For more information see https://tokenmarket.net
 *
 * Licensed under the Apache License, version 2.0: https://github.com/TokenMarketNet/ico/blob/master/LICENSE.txt
 */

pragma solidity ^0.4.21;


import "./PricingStrategy.sol";
import "./SafeMathLibExt.sol";
import "./ETHUSD.sol";
import "./Ownable.sol";

/**
 * Fixed crowdsale pricing - everybody gets the same price.
 */
contract FlatPricingExt is PricingStrategy, Ownable {
  using SafeMathLibExt for uint;

  /* How many weis one token costs */
  uint public oneTokenInWei5; 
  uint public oneTokenInCents;
  uint public ethInCents;

  ETHUSD public ethUsdObj;
  // Crowdsale rate has been changed
  event RateChanged(uint newOneTokenInWei);

  modifier onlyTier() {
    if (msg.sender != address(tier)) throw;
    _;
  }

  function setTier(address _tier) onlyOwner {
    assert(_tier != address(0));
    assert(tier == address(0));
    tier = _tier;
  }
  
  function FlatPricingExt(uint _oneTokenInCents, uint _ethToUSDCents, address _ethUSDAddress) onlyOwner {
    
    require(_oneTokenInCents > 0);
    require(_ethToUSDCents > 0);

    oneTokenInCents = _oneTokenInCents;
    ethUsdObj = ETHUSD(_ethUSDAddress);    
    ethInCents = _ethToUSDCents;
  }

  function updateRate(uint _oneTokenInCents) onlyTier {
    
    require(_oneTokenInCents > 0);  

    oneTokenInCents = _oneTokenInCents;   

    RateChanged(oneTokenInCents);
  }

  /**
   * Calculate the current price for buy in amount.
   *
   */
  function calculatePrice(uint value, uint weiRaised, uint tokensSold, address msgSender, uint decimals) public constant returns (uint) {
    uint multiplier = 10 ** decimals;
    ethInCents = getEthInCents();
    oneTokenInWei5 = oneTokenInCents.times(multiplier).divides(ethInCents);

    uint oneTokenInWei1 = oneTokenInWei5.times(60).divides(100);
    uint oneTokenInWei2 = oneTokenInWei5.times(80).divides(100);
    uint oneTokenInWei3 = oneTokenInWei5.times(90).divides(100);
    uint oneTokenInWei4 = oneTokenInWei5.times(95).divides(100);  

    if(tokensSold <= 25000000 * multiplier)
      return value.times(multiplier) / oneTokenInWei1;
    if(tokensSold > 25000000 * multiplier && tokensSold <= 80000000 * multiplier)
      return value.times(multiplier) / oneTokenInWei2;
    if(tokensSold > 80000000 * multiplier && tokensSold <= 120000000 * multiplier)
      return value.times(multiplier) / oneTokenInWei3;
    if(tokensSold > 120000000 * multiplier && tokensSold <= 140000000 * multiplier)
      return value.times(multiplier) / oneTokenInWei4;
    if(tokensSold > 140000000 * multiplier)
      return value.times(multiplier) / oneTokenInWei5;
  }

  function oneTokenInWei(uint tokensSold, uint decimals) public constant returns (uint) {
   uint multiplier = 10 ** decimals;
    ethInCents = getEthInCents();
    oneTokenInWei5 = oneTokenInCents.times(multiplier).divides(ethInCents);
    
    uint oneTokenInWei1 = oneTokenInWei5.times(60).divides(100);
    uint oneTokenInWei2 = oneTokenInWei5.times(80).divides(100);
    uint oneTokenInWei3 = oneTokenInWei5.times(90).divides(100);
    uint oneTokenInWei4 = oneTokenInWei5.times(95).divides(100);

    if(tokensSold <= 25000000 * multiplier)
      return oneTokenInWei1;
    if(tokensSold > 25000000 * multiplier && tokensSold <= 80000000 * multiplier)
      return oneTokenInWei2;
    if(tokensSold > 80000000 * multiplier && tokensSold <= 120000000 * multiplier)
      return oneTokenInWei3;
    if(tokensSold > 120000000 * multiplier && tokensSold <= 140000000 * multiplier)
      return oneTokenInWei4;
    if(tokensSold > 140000000 * multiplier)
      return oneTokenInWei5;
  }

  function getEthInCents() public constant returns (uint) {
     return ethUsdObj.ethInCents();
  }

}
