const ETHUSD = artifacts.require("./ETHUSD.sol");

module.exports = function (deployer) {      
      deployer.deploy(ETHUSD, { value: 300000000000000000 });
      //deployer.deploy(ETHUSD);
};

