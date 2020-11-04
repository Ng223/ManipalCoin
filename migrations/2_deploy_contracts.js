const ManipalCoin = artifacts.require("./ManipalCoin.sol");
const ManipalCoinSale = artifacts.require("./ManipalCoinSale.sol");

module.exports = function(deployer) {
  deployer.deploy(ManipalCoin,100000).then(function() {
    var tokenPrice = 10000000000000;
    return deployer.deploy(ManipalCoinSale, ManipalCoin.address, tokenPrice);
  });
};
