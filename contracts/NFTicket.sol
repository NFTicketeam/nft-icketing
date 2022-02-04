pragma solidity >=0.4.24 <=0.5.6;

contract NFTicket {
    // 승인된 레스토랑 리스트
    address[] public restaurants = [0x0000000000000000000000000000000000000000];

    mapping(uint256 => address) public tokenOwner;
    mapping(uint256 => uint) public timestamps;
    mapping(address => uint256[]) private _ownedTokens;

    // 승인된 레스토랑 여부 체크
    function isValidRestaurant(address restaurant) private returns (bool) {
        bool isValid = false;

        for (uint256 i = 0; i < restaurants.length; i++) {
            if (restaurant == restaurants[i]) {
                isValid = true;
                break;
            }
        }
        return isValid;
    }

    function mintWithTimestamp(address to, uint256 tokenId, uint timestamp) public returns (bool) {
        // 승인된 레스토랑만 토큰 발행 가능
        require(isValidRestaurant(msg.sender), "msg.sender is not valid.");

        // to 에게 tokenId 발행
        // timestamp 에 날짜와 시간 설정
        tokenOwner[tokenId] = to;
        timestamps[tokenId] = timestamp;

        // add token to the list
        _ownedTokens[to].push(tokenId);

        return true;
    }
}