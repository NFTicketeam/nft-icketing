# NFT-icketing

## Contract

### 1. NFT Contract
- KIP17 NFT
- mint
    - 지정된 주소에 token 발행
    - Token 에 데이터 설정 (**장소, 날짜, 시간** 등)
    - 특정 사용자(티켓 발행 주체)만 발행 가능
- transfer
    - Token ID를 이용해서 다른 주소에 Token 을 전송 가능
    - 토큰 소유자만 자신의 토큰을 전송 가능

### 2. Market Contract
- Smart Contract for Market
- buyNFT
    - 고객은 Market Contract의 buyNFT를 통해 Market Contract가 일시적으로 소유한 NFT를 구매 할 수 있음
    - NFT를 구매하기 위해서는 0.01 Klay가 필요
    - buyNFT를 호출한 sender에게 NFT를 전송함

## BApp

### 1. Main
- 지갑 연동 및 잔고 조회
- 발행된 티켓 리스트
- 티켓 구매

### 2. Mint
- 장소, 날짜, 시간 등의 데이터 설정하여 발행
- 특정 사용자(티켓 발행 주체)만 발행

### 3. Wallet
- 자신이 소유한 티켓 리스트
- 티켓 재판매