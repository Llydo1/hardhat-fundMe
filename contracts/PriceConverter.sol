// SPDX-License-Identifier: MIT
// Declare solidity version
pragma solidity ^0.8.0;

// Import library
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// @title A library for price converting
// @author Llydo1
// @dev This uses price feed from chainlinks
library PriceConverter {
    // @dev This using price feed from chainlinks
    // @params priceFeed The address of AggregatorV3Interface contract
    // @return Usd amount represent the amount of ethereum
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price * 1e10);
    }

    // @dev This function for get converting rate
    // @params ethAmount the amount of ether for converting
    // @params priceFeed The address of AggregatorV3Interface contract
    // @return The current conversion rate from chainlink datafeeds
    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        return (getPrice(priceFeed) * ethAmount) / 1e18;
    }
}
