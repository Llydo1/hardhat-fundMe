const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("FundMe", () => {
  let fundMe, deployer, deployerSigner, thirdAccount, mockV3Aggregator;
  const oneEth = ethers.utils.parseEther("1");

  // Assign fundMe, deployer, deployerSigner, thirdAccount, mockV3Aggregator
  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    thirdAccount = (await getNamedAccounts()).thirdAccount;
    await deployments.fixture(["all"]);
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
    deployerSigner = ethers.provider.getSigner(deployer);
  });

  // constructor test
  describe("constructor", () => {
    it("sets the aggregator address correctly", async () => {
      const response = await fundMe.priceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });

  // receive() test
  describe("receive function", () => {
    it("check fund has been trigger", async () => {
      await deployerSigner.sendTransaction({
        to: fundMe.address,
        value: oneEth,
      });
      await ethers.provider.getSigner(thirdAccount).sendTransaction({
        to: fundMe.address,
        value: oneEth,
      });
      const firstFunderAddress = await fundMe.s_funders(0);
      const secondFunderAddress = await fundMe.s_funders(1);
      assert.equal(firstFunderAddress, deployer);
      assert.equal(secondFunderAddress, thirdAccount);
    });

    it("check fund has not been trigger", async () => {
      await expect(
        deployerSigner.sendTransaction({
          to: fundMe.address,
          value: "3736934741908603",
        })
      ).to.be.revertedWithCustomError(fundMe, "FundMe__NotEnough");

      await expect(
        ethers.provider.getSigner(thirdAccount).sendTransaction({
          to: fundMe.address,
          value: "3736934741908603",
        })
      ).to.be.revertedWithCustomError(fundMe, "FundMe__NotEnough");

      await fundMe.s_funders(0).catch((e) => assert("CALL_EXCEPTION", e.code));
    });
  });

  // fallback() test
  describe("fallback function test", () => {
    it("check fund has been trigger by fallback", async () => {
      await deployerSigner.sendTransaction({
        to: fundMe.address,
        value: oneEth,
        data: "0x12313231",
      });
      await ethers.provider.getSigner(thirdAccount).sendTransaction({
        to: fundMe.address,
        value: oneEth,
        data: "0x",
      });
      const firstFunderAddress = await fundMe.s_funders(0);
      const secondFunderAddress = await fundMe.s_funders(1);
      assert.equal(firstFunderAddress, deployer);
      assert.equal(secondFunderAddress, thirdAccount);
    });

    it("check fund has not been trigger by fallback", async () => {
      await deployerSigner
        .sendTransaction({
          to: fundMe.address,
          value: "3736934741908603",
          data: "0x12313231",
        })
        .catch((e) => assert("UNPREDICTABLE_GAS_LIMIT", e.code));

      await ethers.provider
        .getSigner(thirdAccount)
        .sendTransaction({
          to: fundMe.address,
          value: "3736934741908603",
          data: "0x1a315231",
        })
        .catch((e) => assert("UNPREDICTABLE_GAS_LIMIT", e.code));

      await fundMe.s_funders(0).catch((e) => assert("CALL_EXCEPTION", e.code));
    });
  });

  // fund() test
  describe("fund", () => {
    it("Fails if you don't send enouth ETH", async () => {
      await expect(fundMe.fund()).to.be.revertedWithCustomError(
        fundMe,
        "FundMe__NotEnough"
      );
    });
  });

  describe("withdraw", () => {
    beforeEach(async () => {
      await fundMe.fund({ value: oneEth });
    });

    it("deployer balance after withdraw must be equal fundMe balance before withdraw", async () => {
      const fundMeStartingBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const senderStartingBalance = await fundMe.provider.getBalance(deployer);

      const { effectiveGasPrice, gasUsed } = await (
        await fundMe.withdraw()
      ).wait(1);
      const gasPrice = effectiveGasPrice.mul(gasUsed);

      const fundMeEndBalance = await fundMe.provider.getBalance(fundMe.address);
      const senderEndbalance = await fundMe.provider.getBalance(deployer);

      // Assert
      assert.equal(fundMeEndBalance, 0);
      assert.equal(
        fundMeStartingBalance.add(senderStartingBalance).toString(),
        senderEndbalance.add(gasPrice).toString()
      );
      await fundMe.s_funders(0).catch((e) => assert("CALL_EXCEPTION", e.code));
    });

    it("multiple s_funders check", async () => {
      // Fund sent by multiple accounts
      const accounts = await ethers.getSigners();
      for (let i = 1; i < 8; i++) {
        await (
          await (await fundMe.connect(accounts[i])).fund({ value: oneEth })
        ).wait(1);
        // First test
        assert.equal(await fundMe.s_funders(i), accounts[i].address);
        assert.equal(
          (await fundMe.addressToamountFunded(accounts[i].address)).toString(),
          oneEth.toString()
        );
      }

      // Arrange
      const fundMeStartingBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const senderStartingBalance = await fundMe.provider.getBalance(deployer);

      const { effectiveGasPrice, gasUsed } = await (
        await fundMe.withdraw()
      ).wait(1);
      const gasPrice = effectiveGasPrice.mul(gasUsed);

      const fundMeEndBalance = await fundMe.provider.getBalance(fundMe.address);
      const senderEndbalance = await fundMe.provider.getBalance(deployer);

      // Second Test
      assert.equal(fundMeEndBalance, 0);
      assert.equal(
        fundMeStartingBalance.add(senderStartingBalance).toString(),
        senderEndbalance.add(gasPrice).toString()
      );
      await fundMe.s_funders(0).catch((e) => assert("CALL_EXCEPTION", e.code));
    });

    it("only owner can withdraw the fund", async () => {
      const accounts = await ethers.getSigners();
      for (let i = 1; i < 8; i++) {
        await expect(
          (await fundMe.connect(accounts[i])).withdraw()
        ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
      }
    });
  });
});
