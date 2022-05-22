import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { ethers } from "hardhat";

describe("BTSETHPool", function () {
  let pool: Contract;
  let owner: SignerWithAddress;
  let addrA: SignerWithAddress; 
  let addrB: SignerWithAddress; 
  let addrT: SignerWithAddress;

  beforeEach(async function () {
    const Pool = await ethers.getContractFactory("BTSETHPool");
    [owner, addrA, addrB, addrT] = await ethers.getSigners();

    pool = await Pool.deploy();
    await pool.deployed();
    await pool.addTeamMember(addrT.address);
  });

  it("Should fail if all accounts hasn't right role", async function () {
    const roleO = await pool.hasRole(keccak256(toUtf8Bytes('TEAM_ROLE')), owner.address);
    const roleA = await pool.hasRole(keccak256(toUtf8Bytes('TEAM_ROLE')), addrA.address);
    const roleB = await pool.hasRole(keccak256(toUtf8Bytes('TEAM_ROLE')), addrB.address);
    let roleT = await pool.hasRole(keccak256(toUtf8Bytes('TEAM_ROLE')), addrT.address);

    expect(roleO).to.equal(true);
    expect(roleA).to.equal(false);
    expect(roleB).to.equal(false);
    expect(roleT).to.equal(true);

    console.log('Owner has team role: ', roleO);
    console.log('A has team role: ', roleA);
    console.log('B has team role: ', roleB);
    console.log('T has team role: ', roleT);
  });
  
  it("Should fail if all depositors hasn't right rewards 1)", async function () {
    // A deposit 100
    const depositA = await pool.connect(addrA).deposit({from: addrA.address, value: 100});
    await depositA.wait();
    console.log("A deposits 100");

    // B deposit 300
    const depositB = await pool.connect(addrB).deposit({from: addrB.address, value: 300});
    await depositB.wait();
    console.log("B deposits 300");

    // T deposit rewards 200
    const depositT = await pool.connect(addrT).depositRewards({from: addrT.address, value: 200});
    await depositT.wait();
    console.log("T deposits 200 rewards");

    // Get A's rewards
    const rewardsA = await pool.getRewards(addrA.address);
    const rewardsB = await pool.getRewards(addrB.address);
    expect(rewardsA).to.equal(BigNumber.from("150"));
    expect(rewardsB).to.equal(BigNumber.from("450"));

    console.log("A's pending rewards: ", rewardsA.toString());
    console.log("B's pending rewards: ", rewardsB.toString());
  });

  it("Should fail if all depositors hasn't right rewards 2)", async function () {
    // A deposit 100
    const depositA = await pool.connect(addrA).deposit({from: addrA.address, value: 200});
    await depositA.wait();
    console.log("A deposits 200");

    // T deposit rewards 200
    const depositT = await pool.connect(addrT).depositRewards({from: addrT.address, value: 100});
    await depositT.wait();
    console.log("T deposits 100 rewards");

    // B deposit 300
    const depositB = await pool.connect(addrB).deposit({from: addrB.address, value: 150});
    await depositB.wait();
    console.log("B deposits 150");

    // Get A's rewards
    const rewardsA = await pool.getRewards(addrA.address);
    const rewardsB = await pool.getRewards(addrB.address);
    expect(rewardsA).to.equal(BigNumber.from("300"));
    expect(rewardsB).to.equal(BigNumber.from("150"));

    console.log("A's pending rewards: ", rewardsA.toString());
    console.log("B's pending rewards: ", rewardsB.toString());

    const claimA = await pool.connect(addrA).claimRewards();
    await claimA.wait();
    console.log("A claim rewards");

    const claimB = await pool.connect(addrB).claimRewards();
    await claimB.wait();
    console.log("B claim rewards");
  });
});
