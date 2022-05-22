//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";

contract BTSETHPool is AccessControl {
  using SafeMath for uint256;

  bytes32 public constant TEAM_ROLE = keccak256("TEAM_ROLE");
  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

  uint256 poolBalance;
  bool isPoolStarted;

  struct UserInfo {
    uint256 totalDepositedAmount;
    uint256 pendingRewards;
    uint256 depositedAmount;
  }

  mapping(address => UserInfo) public userInfo;
  address[] public userAddrs;

  event Receive(uint value);

  constructor() {
    _setupRole(ADMIN_ROLE, msg.sender);
    _setupRole(TEAM_ROLE, msg.sender);
  }

  function addTeamMember(address account) public {
    _grantRole(TEAM_ROLE, account);
  }

  function removeTeamMember(address account) public {
    _revokeRole(TEAM_ROLE, account);
  }

  event Deposit(address indexed _address, uint256 _value);
  event DepositRewards(address indexed _address, uint256 _value);
  event Claim(address indexed _address, uint256 _value);

  // User deposit
  /// @notice `msg.sender` deposits `msg.value`
  function deposit() external payable {
    uint256 _amount = msg.value;

    require(
      _amount > 0,
      "BTSETHPool::deposit: amount must be greater than 0"
    );

    if (!isPoolStarted) {
      // Start a new pool
      poolBalance = 0;
      isPoolStarted = true;

      for (uint i=0; i<userAddrs.length; i++) {
        UserInfo storage __userInfo = userInfo[userAddrs[i]];
        __userInfo.pendingRewards = __userInfo.pendingRewards.add(__userInfo.depositedAmount);
        __userInfo.depositedAmount = 0;
      }
    }

    UserInfo storage _userInfo = userInfo[msg.sender];
    if (_userInfo.totalDepositedAmount == 0) {
      userAddrs.push(msg.sender);
    }

    _userInfo.totalDepositedAmount += _amount;
    _userInfo.depositedAmount += _amount;

    poolBalance += _amount;

    emit Deposit(msg.sender, msg.value);
  }

  // Only Team deposit the rewards
  /// @notice `msg.sender` deposits rewards `msg.value`
  function depositRewards() public payable onlyRole(TEAM_ROLE) {
    uint256 _amount = msg.value;
    require(
      _amount > 0,
      "BTSETHPool::depositRewards: amount must be greater than 0"
    );

    require(
      poolBalance > 0, 
      "BTSETHPool::depositRewards: No pool started"
    );
    
    // Stop the current pool

    isPoolStarted = false;

    for (uint i=0; i<userAddrs.length; i++) {
      UserInfo storage _userInfo = userInfo[userAddrs[i]];
      _userInfo.pendingRewards = _userInfo.pendingRewards.add(_userInfo.depositedAmount.mul(1e12).div(poolBalance).mul(_amount).div(1e12));
    }

    emit DepositRewards(msg.sender, msg.value);
  }

  // Claim rewards
  /// @notice Claim by `msg.sender`
  function claimRewards() public {
    UserInfo storage _userInfo = userInfo[msg.sender];
    uint256 _amount = _userInfo.depositedAmount + _userInfo.pendingRewards;

    require(
      _amount > 0, 
      "BTSETHPool::claimRewards: You don't have anything left to withdraw"
    );

    payable(msg.sender).transfer(_amount);
    _userInfo.depositedAmount = 0;
    _userInfo.pendingRewards = 0;

    emit Claim(msg.sender, _amount);
  }

  // Get ETH balance
  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }

  // Get user count
  function getUserCount() public view returns (uint256) {
    return userAddrs.length;
  }

  // Get user addrs
  function getUserAddrs() public view returns (address[] memory) {
    address[] memory returnData = new address[](userAddrs.length);
    for (uint i=0; i<userAddrs.length; i++) {
        returnData[i] = userAddrs[i];
    }
    return returnData;
  }

  // Get user infos
  function getUserInfos() public view returns (UserInfo[] memory returnData) {
    returnData = new UserInfo[](userAddrs.length);
    for (uint i=0; i<userAddrs.length; i++) {
        UserInfo memory _userInfo = userInfo[userAddrs[i]];
        returnData[i] = _userInfo;
    }
    return returnData;
  }

  // Get user rewards
  function getRewards(address addr) public view returns (uint256 returnData) {
    UserInfo memory _userInfo = userInfo[addr];

    returnData = _userInfo.depositedAmount + _userInfo.pendingRewards;
    return returnData;
  }
}
