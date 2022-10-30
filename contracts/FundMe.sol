//SPDX-License-Identifier: MIT
// Declare solidity version
pragma solidity ^0.8.0;

// Import library
import "./PriceConverter.sol";

error FundMe__NotOwner();
error FundMe__NotEnough();
error FundMe__isError();

// @title A contract for crowd funding
// @author Llydo1
// @notice This contract is a practice to learn web3
// @dev This implements price feed from chainlinks
contract FundMe {
    // Type Declaration
    using PriceConverter for uint256;

    // State Variables!
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address[] public s_funders;
    mapping(address => uint256) public addressToamountFunded;
    address public immutable i_owner;
    AggregatorV3Interface public immutable priceFeed;

    // Modifier
    // @notice Check for the owner of the contract
    modifier onlyOwner() {
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // Functions constructor
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // Functions recieve, fallback
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    // Functions
    // @notice This function funds this contract
    // @dev This implements price feed from chainlinks
    function fund() public payable {
        if (msg.value.getConversionRate(priceFeed) < MINIMUM_USD)
            revert FundMe__NotEnough();
        s_funders.push(msg.sender);
        addressToamountFunded[msg.sender] += msg.value;
    }

    // @notice This function withdraw the fund to the contract owner
    function withdraw() public onlyOwner {
        address[] memory funders = s_funders;
        for (uint256 i = 0; i < funders.length; i++) {
            addressToamountFunded[funders[i]] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        if (!callSuccess) revert FundMe__isError();
    }
}
