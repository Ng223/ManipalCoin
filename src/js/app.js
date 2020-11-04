App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 10000000000000,
  tokensInCirculation: 0,
  tokensAvailable: 100000,

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: async function() {
  // Modern dapp browsers…
  if (window.ethereum) {
  App.web3Provider = window.ethereum;
  try {
  // Request account access
  await window.ethereum.enable();
  console.log("here2");
  } catch (error) {
  // User denied account access…
  console.error("User denied account access");
  }
  }
  // Legacy dapp browsers…
  else if (window.web3) {
  App.web3Provider = window.web3.currentProvider;
  }
  // If no injected web3 instance is detected, fall back to Ganache
  else {
  App.web3Provider = new Web3.providers.HttpProvider("http://localhost:9545");
  }
  // App.web3Provider = new Web3.providers.HttpProvider(‘http://localhost:8545');
  web3 = new Web3(App.web3Provider);
  return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("ManipalCoinSale.json", function(ManipalCoinSale) {
      App.contracts.ManipalCoinSale = TruffleContract(ManipalCoinSale);
      App.contracts.ManipalCoinSale.setProvider(App.web3Provider);
      App.contracts.ManipalCoinSale.deployed().then(function(ManipalCoinSale) {
        console.log("ManipalCoin Token Sale Address:", ManipalCoinSale.address);
      });
    }).done(function() {
      $.getJSON("ManipalCoin.json", function(ManipalCoin) {
        App.contracts.ManipalCoin = TruffleContract(ManipalCoin);
        App.contracts.ManipalCoin.setProvider(App.web3Provider);
        App.contracts.ManipalCoin.deployed().then(function(ManipalCoin) {
          console.log("ManipalCoin Token Address:", ManipalCoin.address);
        });

        App.listenForEvents();
        return App.render();
      });
    })
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.ManipalCoinSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      App.account = accounts[0];
        $('#accountAddress').html("Your Account: " + account);
      });

    // Load token sale contract
    App.contracts.ManipalCoinSale.deployed().then(function(instance) {
      ManipalCoinSaleInstance = instance;
      return ManipalCoinSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
      return ManipalCoinSaleInstance.tokensInCirculation();
    }).then(function(tokensInCirculation) {
      App.tokensInCirculation = tokensInCirculation.toNumber();
      $('.tokens-sold').html(App.tokensInCirculation);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensInCirculation) / (App.tokensAvailable)) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.ManipalCoin.deployed().then(function(instance) {
        ManipalCoinInstance = instance;
        return ManipalCoinInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.dapp-balance').html(balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.ManipalCoinSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000 // Gas limit
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset') // reset number of tokens in form
      // Wait for Sell event
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});
