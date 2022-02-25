import React, { useState, useEffect, Fragment } from "react";
import QRCode from "qrcode.react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faWallet, faPlus, faArrowLeft, faAngleDown, faCheck,faSearch, faAngleRight, faAngleLeft} from "@fortawesome/free-solid-svg-icons";
import { getBalance, fetchCardsOf, getPriceOf, sellCardOf } from "./api/UseCaver";
import * as KlipAPI from "./api/UseKlip";
import * as KasAPI from "./api/UseKAS";
import _ from 'lodash';
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./market.css";
import {
  Navbar,
  Dropdown,
  Alert,
  Container,
  Card,
  Nav,
  Form,
  Button,
  Modal,
  Row,
  Col,
  ButtonGroup,
  ToggleButton,
  Image,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import { MARKET_CONTRACT_ADDRESS } from "./constants";

const DEFAULT_QR_CODE = "DEFAULT";
const DEFAULT_ADDRESS = "0x00000000000000000000000000000";
function App() {
  const [nfts, setNfts] = useState([]); // {id: '101', uri: ''}
  const [myBalance, setMyBalance] = useState("0");
  const [myAddress, setMyAddress] = useState("0x00000000000000000000000000000");
  const [nft, setNft] = useState({id: '1', uri: ''});

  // UI
  const [qrvalue, setQrvalue] = useState(DEFAULT_QR_CODE);
  const [tab, setTab] = useState("MARKET"); // MARKET, MINT, WALLET, DETAIL
  const [tabBefore, setTabBefore] = useState("MARKET"); // MARKET, MINT, WALLET, DETAIL, SELL
  const [mintTokenId, setMintTokenId] = useState("");
  const [mintImageUrl, setMintImageUrl] = useState("");
  const [mintCategory, setMintCategory] = useState("dining");
  const [mintName, setMintName] = useState("");
  const [mintTitle, setMintTitle] = useState("");
  const [mintDatetime, setMintDatetime] = useState("");
  const [mintDescription, setMintDescription] = useState("");
  const [mintPlace, setMintPlace] = useState("");
  const [sellPrice, setSellPrice] = useState("");

  const [searchText, setSearchText] = useState("");
  const [categoryText, setCategoryText] = useState("카테고리");
  const [filterText, setFilterText] = useState("등록순");

  const [walletDp, setWalletDp] = useState("WALLET");


  const categories = [
    { name: '식사권', value: 'dining' },
    { name: '쿠킹 클래스', value: 'class' },
    { name: '리미티드 예약', value: 'limited' }
  ];

  const [clickedCategory, setClickedCategory] = useState(0);
  const [clickedFilter, setClickedFilter] = useState(1);
  const [isCategory, setIsCategory] = useState(false);

  const [showCategory, setShowCategory] = useState(false);
  const [categoryModalProps, setCategoryModalProps] = useState({
    title: "MODAL",
    onConfirm: () => { },
  });
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState({
    title: "MODAL",
    onConfirm: () => {},
  });
  const rows = nfts.slice(nfts.length / 2);
  const fetchMarketNFTs = async () => {
    const _nfts = await fetchCardsOf(MARKET_CONTRACT_ADDRESS);
    for (var nft of _nfts) {
      const _price = await getPriceOf(nft.id);
      nft.price = _price / 1000000000000000000;
      nft.uri.categoryKor = _.filter(categories, (i) => {return i.value === nft.uri.category})[0].name;
    }

    setNfts(_nfts);
  };

  const setSearch = async (searchText) => {
    const _nfts = await fetchCardsOf(MARKET_CONTRACT_ADDRESS);
    let _nft= _nfts;
    for (var nft of _nft) {
      const _price = await getPriceOf(nft.id);
      nft.price = _price / 1000000000000000000;
    }
    if(!categoryText.includes("전체") && !categoryText.includes("카테고리")){
      _nft = _nft.map(o =>
       (o.uri.category.includes(categories.find(o => o.name === categoryText).value) ? o : null )).filter(o => (o !== null));
    }
    
     if(searchText == '') {
      setNfts(_nft);
     }else{
      _nft = _nft.map((o,idx)=>(o.uri.title.includes(searchText) ? o : null)).filter(o => (o !== null));
      setNfts(_nft);
     }


  };

  const fetchMyNFTs = async () => {
    if (myAddress === DEFAULT_ADDRESS) {
      alert("NO ADDRESS");
      return;
    }
    const _nfts = await fetchCardsOf(myAddress);
    _.map(_nfts, (i) => {
      i["categoryKor"] = _.filter(categories, (ctg) => {return ctg.value === i.uri.category})[0].name;
    })
  };

  const onClickMintButton = (image, name, category, title, datetime, description, place) => {
    setModalProps({
      title: "발행하시겠습니까?",
      onConfirm: () => {
        setTabBefore("MINT")
        onClickMint(image, name, category, title, datetime, description, place);
      },
    });
    setShowModal(true);
  }

  const onClickMint = async (image, name, category, title, datetime, description, place) => {
    if (myAddress === DEFAULT_ADDRESS) {
      alert("NO ADDRESS");
      return;
    }

    const metadataURL = await KasAPI.uploadMetaData(image, name, category, title, datetime, description, place);
    if (!metadataURL) {
      alert("metadata upload fail")
      return;
    }

    // const randomTokenId = parseInt(Math.random() * 10000000);
    KlipAPI.mintCardWithURI(
      myAddress,
      mintTokenId,
      metadataURL,
      setQrvalue,
      (result) => {
        // alert(JSON.stringify(result));
        setTab("COMPLETE")
      }
    );
  };

  const onClickTransfer = (id) => {
    if (tab === "SELL") {
      if (sellPrice == "" || sellPrice <= 0) {
        alert("금액을 정확히 입력해주세요.")
        return
      }
      setModalProps({
        title: "판매하시겠습니까?",
        onConfirm: () => {
          onClickMyCard(id);
        },
      });
      setShowModal(true);
    }
    if (tabBefore === "WALLET") {
      setTab("SELL")
      setTabBefore("DETAIL")
    }
    if (tabBefore === "MARKET") {
      setModalProps({
        title: "구매하시겠습니까?",
        onConfirm: () => {
          onClickMarketCard(id);
        },
      });
      setShowModal(true);
    }
  };

  const onClickMyCard = async (tokenId) => {    
    await sellCardOf(tokenId, sellPrice);

    KlipAPI.listingCard(myAddress, tokenId, setQrvalue, (result) => {
      console.log(JSON.stringify(result));
      // alert("판매 완료되었습니다.")
      setTab("COMPLETE")
    });
  };

  const onClickMarketCard = async (tokenId) => {
    const price = await getPriceOf(tokenId)

    KlipAPI.buyCard(tokenId, price, setQrvalue, (result) => {
      console.log(JSON.stringify(result));
      // alert("구매 완료되었습니다.")
      setTab("COMPLETE")
    });
  };

  const showCategoryModal = (text) => {
    setCategoryModalProps({
      title: text,
      onConfirm: () => {
      },
    });
    setShowCategory(true);
  };

  const changeWalletDp = (dp) => {
    setWalletDp(dp);
  }


  const getUserData = () => {
    setModalProps({
      title: "Klip 지갑을 연동하시겠습니까?",
      onConfirm: () => {
        KlipAPI.getAddress(setQrvalue, async (address) => {
          setMyAddress(address);
          const _balance = await getBalance(address);
          setMyBalance(_balance);
        });
      },
    });
    setShowModal(true);
  };

  useEffect(() => {
    // getUserData();
    fetchMarketNFTs();
  }, []);
  return (
    <div className="App">
      <div style={{ padding: 10 }}>

        {tab === "WALLET" && walletDp === 'WALLET' ? (
        // {/* 주소 잔고 */}
        <Fragment>
          <div style={{display:"flex", marginTop:"10%", minHeight:"100px"}}>
            <div style={{ width: "25%"}}> 사진 </div>
            <div style={{ width: "65%"}}><div style={{fontSize:"20sp", color:"#2d2d2d"}}>홍길동</div><div style={{fontSize:"3px", color:"#5e5e5e"}}>{myAddress}</div>
            </div>
          </div>
          <div
              style={{
                backgroundColor: "#f5f5f5",
                minHeight: "110px",
                marginTop: "10%",
                padding: "10% 2%"
              }}
          >
            <div>
              <font style={{
                  fontSize: 20,
                  fontWeight: "bold", 
              }}
              >
                내 자산
              </font>
            </div>
            <div style={{
              padding: "1%",
              display: "inline-block",
              whiteSpace: "nowrap",
              overflow : "hidden",
              textOverflow : "ellipsis"
            }}>
            {myAddress !== DEFAULT_ADDRESS
              ? `${myBalance} KLAY `
              : "지갑 연동 안됨"
            }
            </div>
          </div>
          <div style={{
            marginTop: "5%",
            width : "100%",
            display : "flex"
          }}
            onClick= {() => changeWalletDp('OWN')}
          >
             <span style={{ padding: "3%", width : "40%" }}>소유한 티켓</span>
             <span style={{ padding: "3%", width : "60%" }}><FontAwesomeIcon color="gray" size="1x" icon={faAngleRight} /></span>
          </div>
          <div style={{
            marginTop: "5%",
            width : "100%",
            display : "flex"
          }}
          onClick= {() => changeWalletDp('SELL')}
          >
             <span style={{ padding: "3%", width : "40%" }}>판매 중인 티켓</span>
             <span style={{ padding: "3%", width : "60%" }}><FontAwesomeIcon color="gray" size="1x" icon={faAngleRight} /></span>
          </div>
        </Fragment>
        ) : null}

        {myAddress === DEFAULT_ADDRESS ? (
        // {/* 로그인 전 화면 (지갑 연동하기) */}
        <div style={{textAlign:'center', marginTop:250, paddingRight:10}}>
          <img src="drawable-mdpi/frame_79.png" style={{width:75, height:74}}/><br/><br/>
          <img src="drawable-mdpi/dine.png" style={{width:52, height:18}}/><br/><br/>
          <p>NFT와 함께하는 특별한 다이닝</p><br/><br/>
          <Button
            onClick={getUserData}
            variant={"balance"}
            style={{ backgroundColor: "#000000", color: '#FFFFFF', fontSize: 25, textAlign: "center", width:340 }}
          >로그인
          </Button>
        </div>
        ) : null }

       {/* 로그인 후 마켓 헤더 */}
       {myAddress !== DEFAULT_ADDRESS && tab === "MARKET" ? (
          <>
            <Container>
              이번주<br />
              인기있는 쿠킹클래스는?
            </Container>
            <Container>
              <InputGroup className="mb-3">
                {/* <Form className="d-flex" value={searchText}> */}
                    <FormControl
                          value={searchText}
                          placeholder="검색어를 입력해 주세요." 
                          type="text"
                          style={{ width: 200 }}
                          onChange={(e) => {
                            setSearchText(e.target.value);
                          }}
                        />
                    <Button 
                        variant="outline-secondary"
                        // size="sm"
                        onClick={() => {setSearch(searchText)}} 
                        style={{width: 100}}
                        >
                        <FontAwesomeIcon 
                        color="black" 
                        size="1x" icon={faSearch}
                        style={{width: 50}}
                        />
                      </Button>
                  {/* </Form> */}
                </InputGroup>
            </Container>
            <Navbar>
              <Container>
                <Navbar.Text>
                  Market
                </Navbar.Text>
                <Navbar.Collapse className="justify-content-end">
                  <div>
                    <Button 
                      size="sm"
                      style={{width:"30%"}}
                      onClick={() => {
                      showCategoryModal("카테고리");
                      setIsCategory(true);
                    }} variant="category" >
                      {categoryText}
                      {'  '}
                      <FontAwesomeIcon color="black" size="lg" style={{width:"20%"}} icon={faAngleDown} />
                    </Button>
                    {'  '}
                    <Button size="sm"
                      style={{width:"30%"}}
                      onClick={() => {
                      showCategoryModal("정렬");
                      setIsCategory(false);
                    }} variant="category" >
                      {filterText}
                      {'  '}
                      <FontAwesomeIcon color="black" size="lg" style={{width:"20%"}} icon={faAngleDown} />
                    </Button>
                  </div>
                </Navbar.Collapse>
              </Container>
            </Navbar>
          </>

        ) : null}

        {/* 갤러리(마켓, 내 지갑) */}
        {myAddress !== DEFAULT_ADDRESS && (tab === "MARKET"|| (tab === "WALLET") && (walletDp === 'OWN' || walletDp === 'SELL')) ? (
          
          <Fragment>
          {tab === "WALLET" || walletDp === 'OWN' || walletDp === 'SELL' ? 
            <Fragment>
              <div style={{ marginTop: "5%", display : "flex" }}   onClick={() => {
                setTab("WALLET");
                setWalletDp("WALLET");
                fetchMyNFTs();
                setQrvalue("DEFAULT")
              }} >
                <span style={{ padding: "3%"}}><FontAwesomeIcon color="gray" size="lg" icon={faAngleLeft} /> </span>
              </div>
                
          </Fragment>
          : ''}

          <div className="container" style={{ padding: 0, width: "100%" }}>
            {rows.map((o, rowIndex) => (
              <>
               <Row key={`rowkey${rowIndex}`}>
                <Col style={{ marginRight: 0, paddingRight: 0, width: "50%" }}>
                  {
                  <Card
                    onClick={() => {
                      tab === "MARKET" ? setTabBefore("MARKET") : setTabBefore("WALLET")
                      setTab("DETAIL")
                      setNft(nfts[rowIndex * 2])
                    }}
                  >
                    <Card.Img src={nfts[rowIndex * 2].uri.image} maxHeight="164"/>
                      
                    <Card.Text>[{nfts[rowIndex * 2 ].uri.datetime}]</Card.Text>
                      <Card.Text>[{nfts[rowIndex * 2].uri.title}]</Card.Text>
                      <Card.Text>[{nfts[rowIndex * 2].price}]KLAY</Card.Text>
                      <Card.Text>[{nfts[rowIndex * 2].uri.place}]</Card.Text>
                  </Card>
                  }
                </Col>
                  
                <Col style={{ marginRight: 0, paddingRight: 0, width: "50%" }}>
                  {nfts.length > rowIndex * 2 + 1 ? (
                    <Card
                      onClick={() => {
                        tab === "MARKET" ? setTabBefore("MARKET") : setTabBefore("WALLET")
                        setTab("DETAIL")
                        setNft(nfts[rowIndex * 2 + 1])
                      }}
                    >
                      <Card.Img src={nfts[rowIndex * 2 + 1].uri.image} />
                      
                      <Card.Text>[{nfts[rowIndex * 2 + 1].uri.datetime}]</Card.Text>
                      <Card.Text>[{nfts[rowIndex * 2 + 1].uri.title}]</Card.Text>
                      <Card.Text>[{nfts[rowIndex * 2 + 1].price}]KLAY</Card.Text>
                      <Card.Text>[{nfts[rowIndex * 2 + 1].uri.place}]</Card.Text>
                    </Card>
                  ) : null}
                </Col>
              </Row>
              </>
              
            )
            
            )} 
          </div>
         </Fragment>
        ) : null}

        {/* 상세 페이지 */}
        {myAddress !== DEFAULT_ADDRESS && tab === "DETAIL" ? (
          <div className="container" style={{ padding: 0, width: "100%" }}>
            <div onClick={() => {
              setTab(tabBefore)
            }}>
              <FontAwesomeIcon color="black" size="lg" icon={faArrowLeft} style={{width:20}} />
            </div>
            <div><Image src={nft.uri.image} /></div><br/>
            <div className="nftDetailContent">
              <div style={{color:"#2d2d2d", fontSize:"25px", fontWeight:"600", marginBottom:"5%"}}> {nft.uri.title}</div>
              <div style={{display:"flex", justifyContent:"space-between"}}>
                 <div> ■ { nft.uri.shop_name} </div> 
                 <div style={{color:"#34cd75", fontSize:"15px", fontWeight:"600", textAlign:"right"}}> {nft.price} KLAY ~</div>
              </div>
              <div className="borderLine"></div>

              <div><label className="detailLb">상세정보</label><span className="detailCont">{nft.uri.description}</span></div>
              <div><label className="detailLb">카테고리</label><span className="detailCont"><span className="detailCont">{ nft.uri.categoryKor || '없음'} </span></span></div>
              <div><label className="detailLb">위치</label><span className="detailCont">{nft.uri.place}</span></div>
              <div className="borderLine"></div>

              <div style={{color:"#000000", fontSize:"20px",  fontWeight:"600", marginTop:"2%"}}> 발행정보 </div>

                <div style={{color:"#2d2d2d", fontSize:"14sp"}}><label className="detailLb">발행일</label><span className="detailCont">{nft.uri.datetime}</span></div>
                <div style={{color:"#2d2d2d", fontSize:"14sp"}}><label className="detailLb">토큰ID</label><span className="detailCont">{nft.id}</span></div>
                <div style={{color:"#2d2d2d", fontSize:"14sp"}}><label className="detailLb">컨트랙트 주소</label><span className="detailCont">{MARKET_CONTRACT_ADDRESS}</span></div>
            </div>
            <Button
              onClick={() => {
                onClickTransfer(nft.id);
              }}
              variant="primary"
              style={{
                backgroundColor: "#000000",
                borderColor: "#000000",
              }}
            >
              {tabBefore === "MARKET" ? "구매하기" : "판매하기"}
            </Button>
          </div>
        ) : null}

        {/* 판매 페이지 */}
        {myAddress !== DEFAULT_ADDRESS && tab === "SELL" ? (
          <div className="container" style={{ padding: 0, width: "100%" }}>
            <div onClick={() => {
              setTab(tabBefore)
              setTabBefore("WALLET")
            }}>
              <FontAwesomeIcon color="black" size="lg" icon={faArrowLeft} style={{width:20}} />
            </div>
            <div className="nftSellContent">
              <div style={{marginTop:"20%"}}>
                {/* <span style={{fontWeight: "600", fontSize: "20px",}}>판매할 가격을 입력해주세요</span> */}
              </div>
              <div>
              <Form>
                <span style={{fontSize:"18px", fontWeight:"bold"}}>판매 금액</span><br/><br/>
                <InputGroup className="mb-3">
                  <FormControl
                    value={sellPrice}
                    placeholder="0"
                    type="number"
                    onChange={(e) => {
                      setSellPrice(e.target.value);
                    }}
                    style={{ width: 200 }}
                  />
                  <InputGroup.Text id="basic-addon2" style={{ width: 100 }}>KLAY</InputGroup.Text>
                </InputGroup>
              </Form>
              </div>
              <div>
                <label className="detailLb">가격 기준</label>
                <div style={{display:"flex", justifyContent:"center", border: "1px solid #b5b5b5", textAlign: "cetner", minHeight:"50px", padding: "3%"}}>
                    <div style={{textAlign:"center"}}><span style={{fontSize:"13px", fontWeight:"700"}}>1KLAY</span><span style={{marginLeft:"10%", fontSize: "11px", color:"#252525"}}>(클레이)</span></div>
                    <div style={{textAlign:"center"}}>  = </div>
                    <div><span style={{fontSize:"13px", fontWeight:"700"}}>1,500</span><span style={{marginLeft:"10%", fontSize: "11px", color:"#252525"}}>(원)</span></div>
                </div>
                
              </div>
              <div>
                <label className="detailLb" style={{marginTop:"10%"}}>티켓 정보</label>
                <div className="borderLine"></div>
                  <div>■ {nft.uri.shop_name} </div>
                  <div style={{fontWeight:"600" , fontSize:"15px"}}>{nft.uri.title}</div>
                  <div style={{fontWeight:"540" , fontSize:"13px"}}>{nft.uri.place}</div>
              </div>
              <div>
                <label className="detailLb" style={{marginTop:"10%"}}>판매수수료</label>
                <div className="borderLine"></div>
                <div style={{display:"flex", justifyContent:"space-between"}}>
                    <div style={{fontWeight:"bold" , fontSize:"13px"}}>수수료 금액</div>
                    <div style={{fontWeight:"540" , fontSize:"13px", textAlign:"right"}}>0.01 KLAY</div>
                </div>
              </div>
            </div>
          
            <Button
              onClick={() => {
                onClickTransfer(nft.id);
              }}
              variant="primary"
              style={{
                backgroundColor: "#000000",
                borderColor: "#000000",
              }}
            >
              판매하기
            </Button>
          </div>
        ) : null}
        
        {/* 발행 페이지 */}
        {tab === "MINT" ? (
          <div className="container" style={{ padding: 0, width: "100%" }}>
            <b>발행할 정보를 입력해주세요</b><br/>
            {mintImageUrl !== "" ? (
              <Card.Img src={mintImageUrl} height={"50%"} />
            ) : null}
            <Form>
              <Form.Group>
                <span>토큰ID</span><span>*</span>
                <Form.Control
                  value={mintTokenId}
                  type="text"
                  placeholder="토큰ID를 입력해 주세요"
                  onChange={(e) => {
                    setMintTokenId(e.target.value);
                  }}
                />
                <br/>
                <span>업체명</span><span>*</span>
                <Form.Control
                  value={mintName}
                  type="text"
                  placeholder="업체명을 입력해 주세요"
                  onChange={(e) => {
                    setMintName(e.target.value);
                  }}
                />
                <br/>
                <span>티켓이미지 주소</span><span>*</span>
                <Form.Control
                  value={mintImageUrl}
                  type="text"
                  placeholder="발행할 티켓이미지 주소를 입력해 주세요"
                  onChange={(e) => {
                    setMintImageUrl(e.target.value);
                  }}
                />
                <br/>
                <span>카테고리</span><span>*</span>
                <ButtonGroup className="mb-2">
                  {categories.map((category, idx) => (
                    <ToggleButton
                      key={idx}
                      id={`category-${idx}`}
                      type="radio"
                      variant='outline-secondary'
                      name="category"
                      value={category.value}
                      checked={mintCategory === category.value}
                      onChange={(e) => setMintCategory(e.currentTarget.value)}
                    >
                      {category.name}
                    </ToggleButton>
                  ))}
                </ButtonGroup>
                <br/>
                <span>제목</span><span>*</span>
                <Form.Control
                  value={mintTitle}
                  type="text"
                  placeholder="제목을 입력해 주세요"
                  onChange={(e) => {
                    setMintTitle(e.target.value);
                  }}
                />
                <br/>
                <span>사용날짜</span><span>*</span>
                <Form.Control
                  value={mintDatetime}
                  type="text"
                  placeholder="사용날짜를 입력해 주세요"
                  onChange={(e) => {
                    setMintDatetime(e.target.value);
                  }}
                />
                <br/>
                <span>티켓 소개</span><span>*</span>
                <Form.Control
                  value={mintDescription}
                  as="textarea"
                  placeholder="자세한 설명을 입력해 주세요"
                  stype={{height:'100px'}}
                  onChange={(e) => {
                    setMintDescription(e.target.value);
                  }}
                />
                <br/>
                <span>모임 장소</span><span>*</span>
                <Form.Control
                  value={mintPlace}
                  type="text"
                  placeholder="모임장소를 입력해주세요"
                  onChange={(e) => {
                    setMintPlace(e.target.value);
                  }}
                />
              </Form.Group>
              <br />
                  <Button
                    onClick={() => {
                      onClickMintButton(mintImageUrl, mintName, mintCategory, mintTitle, mintDatetime, mintDescription, mintPlace);
                    }}
                    variant="primary"
                    style={{
                      backgroundColor: "#000000",
                      borderColor: "#000000",
                    }}
                  >
                    발행하기
                  </Button>
            </Form>
          </div>
        ) : null}

        {/* 완료 페이지 */}
        {myAddress !== DEFAULT_ADDRESS && tab === "COMPLETE" ? (
          <div style={{textAlign:'center', marginTop:250, paddingRight:10}}>
            {tabBefore == "MARKET" ? 
              <div>
                <img src="drawable-mdpi/frame_84.png" style={{width:75, height:74}}/><br/><br/>
                <p style={{fontSize:"20px", fontWeight:"bold"}}>구매 완료!</p><br/><br/>
                <p>구매한 NFT는 마이페이지에서 <br/> 확인할 수 있어요 :)</p>
              </div>
            : tabBefore == "MINT" ?
            <div>
              <img src="drawable-mdpi/frame_85.png" style={{width:75, height:74}}/><br/><br/>
              <p style={{fontSize:"20px", fontWeight:"bold"}}>발행 완료!</p><br/><br/>
              <p>발행한 NFT는 마이페이지에서 <br/> 확인할 수 있어요 :)</p>
            </div>
            :
            <div>
              <img src="drawable-mdpi/frame_86.png" style={{width:75, height:74}}/><br/><br/>
              <p style={{fontSize:"20px", fontWeight:"bold"}}>등록 완료!</p><br/><br/>
              <p>등록한 NFT는 마켓에서 <br/> 확인할 수 있어요 :)</p>
            </div>
            }
            <Button
              onClick={() => {setTab(tabBefore)}}
              variant={"balance"}
              style={{ backgroundColor: "#000000", color: '#FFFFFF', fontSize: 25, textAlign: "center", width:340 }}
            >닫기
            </Button>
          </div>
        ) : null}

        {qrvalue !== "DEFAULT" ? (
          <Container
            style={{
              backgroundColor: "white",
              width: 300,
              height: 300,
              padding: 20,
            }}
          >
            <QRCode value={qrvalue} size={256} style={{ margin: "auto" }} />

            <br />
          </Container>
        ) : null}
      </div>
      <br />
      <br />
  
      <br />
      {/* 모달 */}
      <Modal
        centered
        size="sm"
        show={showModal}
        onHide={() => {
          setShowModal(false);
        }}
      >
        <Modal.Header
          style={{ border: 0, backgroundColor: "#FFFFFF", opacity: 0.8 }}
        >
          <Modal.Title>{modalProps.title}</Modal.Title>
        </Modal.Header>
        <Modal.Footer
          style={{ border: 0, backgroundColor: "#FFFFFF", opacity: 0.8, margin: "auto" }}
        >
          <Button
            variant="primary"
            onClick={() => {
              modalProps.onConfirm();
              setShowModal(false);
            }}
            style={{ backgroundColor: "#000000", borderColor: "#000000" }}
          >
            예
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
            }}
            style={{ backgroundColor: "#E1E1E1", borderColor: "#E1E1E1", color: "#000000" }}
          >
            아니요
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        centered
        size="lg"
        show={showCategory}
        onHide={() => {
          setShowCategory(false);
        }}
      >
        <Modal.Header
          style={{ border: 0, backgroundColor: "#FFFFFF", opacity: 0.8 }}
        >
          <Modal.Title>{categoryModalProps.title}</Modal.Title>
        </Modal.Header>
        <Modal.Footer
          style={{ border: 0, backgroundColor: "#FFFFFF", opacity: 0.8, margin: "auto" }}
        >
          <Nav defaultActiveKey="/home" className="flex-column">
            {(isCategory === true) ?
             <> <Button 
             variant="outline-secondary"
             onClick={() => {
               setShowCategory(false);
               setClickedCategory(0);
               setCategoryText("전체");
             }}>
               전체 {'  '}
               {(clickedCategory===0) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{width:"20"}} /> : null}
           </Button>
           <br />
           <Button 
              variant="outline-secondary"
              onClick={() => {
                setShowCategory(false);
                setClickedCategory(1);
                setCategoryText("식사권");
              }}>
                식사권 {'  '}
                {(clickedCategory===1) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{width:"20"}}  /> : null}
            </Button>
            <br />
            <Button
              variant="outline-secondary"
              onClick={() => {
                 setShowCategory(false);
                 setClickedCategory(2);
                 setCategoryText("쿠킹 클래스");
                }}>
                쿠킹 클래스 {'  '}
                {(clickedCategory===2) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{width:"20"}}  /> : null}

            </Button>
            <br />
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowCategory(false);
                setClickedCategory(3);
                setCategoryText("리미티드 예약");
                }}>
                리미티드 예약 {'  '}
                {(clickedCategory===3) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{width:"20"}}  /> : null}
            </Button>
            </> : //null 
            <>
            <Button 
              variant="outline-secondary"
              onClick={() => {
                setShowCategory(false);
                setClickedFilter(1);
                setFilterText("등록순");
              }}>
                등록순 {'  '}
                {(clickedFilter===1) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{width:"20"}} /> : null}
            </Button>
            <br />
            <Button
              variant="outline-secondary"
              onClick={() => {
                 setShowCategory(false);
                 setClickedFilter(2);
                 setFilterText("마감순");
                }}>
                마감순 {'  '}
                {(clickedFilter===2) ? <FontAwesomeIcon color="#34CD75" size="lg" icon={faCheck} style={{width:"20"}} /> : null}

            </Button>
            </>
            }
          </Nav>
        </Modal.Footer>
      </Modal>  

      {/* 탭 */}
      {myAddress !== DEFAULT_ADDRESS ? (
      <nav
        style={{ backgroundColor: "white", height: 45, width: 390 }}
        className="navbar fixed-bottom navbar-light"
        role="navigation"
      >
        <Nav className="w-100">
          <div className="d-flex flex-row justify-content-around w-100">
            <div
              onClick={() => {
                setTab("MARKET");
                fetchMarketNFTs();
                setQrvalue("DEFAULT")
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div>
                <FontAwesomeIcon color="#1b1717" size="lg" icon={faHome} style={{ width: 130 }}/>
              </div>
            </div>
            <div
              onClick={() => {
                setTab("MINT");
                setQrvalue("DEFAULT")
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div>
                <FontAwesomeIcon color="#1b1717" size="lg" icon={faPlus} style={{ width: 130 }} />
              </div>
            </div>
            <div
              onClick={() => {
                setTab("WALLET");
                fetchMyNFTs();
                setQrvalue("DEFAULT")
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div>
                <FontAwesomeIcon color="#1b1717" size="lg" icon={faWallet} style={{ width: 130 }} />
              </div>
            </div>
          </div>
        </Nav>
      </nav>
      ) : null }
    </div>
  );
}

export default App;