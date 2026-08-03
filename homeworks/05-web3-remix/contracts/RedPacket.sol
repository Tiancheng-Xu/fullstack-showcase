// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

contract RedPacket {
    address payable public tc;
    bool isEqual;
    uint256 public count;
    uint256 public totalAmount;
    uint256 public deadline;
    mapping(address => bool) isGrabbed;

    constructor(uint256 c, bool _isEqual) payable {
        require(msg.value > 0, "RedPacket: value must be greater than 0");
        require(c > 0, "RedPacket: count must be greater than 0");
        tc = payable(msg.sender);
        count = c;
        isEqual = _isEqual;
        totalAmount = msg.value;
        deadline = block.timestamp + 24 hours;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function grabRedPacket() public {
        require(block.timestamp < deadline, "RedPacket expired");
        require(count > 0, "count must > 0");
        require(!isGrabbed[msg.sender], "You have already grabbed the red packet");

        uint256 amount;
        if (count == 1) {
            amount = totalAmount;
        } else if (isEqual) {
            amount = totalAmount / count;
        } else {
            // This address-and-timestamp hash is a course demo, not secure randomness.
            uint256 random = (uint256(keccak256(abi.encodePacked(
                msg.sender,
                tc,
                count,
                totalAmount,
                block.timestamp
            ))) % 8) + 1;
            amount = (totalAmount * random) / 10;
        }

        // Mark the claim and reduce the remaining shares before sending ETH, so a
        // re-entrant external call cannot claim a red packet twice.
        isGrabbed[msg.sender] = true;
        count--;
        totalAmount -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    function refund() public {
        require(msg.sender == tc, "Only sender can refund");
        require(block.timestamp >= deadline, "RedPacket not expired");
        uint256 amount = address(this).balance;
        require(amount > 0, "No balance to refund");
        count = 0;
        totalAmount = 0;
        (bool success, ) = tc.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
