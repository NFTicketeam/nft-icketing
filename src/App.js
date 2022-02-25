import React, { useState, useEffect } from "react";
import QRCode from "qrcode.react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faWallet, faPlus, faArrowLeft, faAngleDown, faCheck,faSearch } from "@fortawesome/free-solid-svg-icons";
import { getBalance, fetchCardsOf, getPriceOf, sellCardOf } from "./api/UseCaver";
import * as KlipAPI from "./api/UseKlip";
import * as KasAPI from "./api/UseKAS";
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
  const [myAddress, setMyAddress] = useState("0xD70D4fCE9cdD0f27902b2e4e2032e31AC02B8c17");
  // const [myAddress, setMyAddress] = useState("0x00000000000000000000000000000");
  const [nft, setNft] = useState({id: '1', uri: ''});

  // UI
  const [qrvalue, setQrvalue] = useState(DEFAULT_QR_CODE);
  const [tab, setTab] = useState("MARKET"); // MARKET, MINT, WALLET, DETAIL
  const [tabBefore, setTabBefore] = useState("MARKET"); // MARKET, MINT, WALLET, DETAIL, SELL
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
    setNfts(_nfts);
  };

  const onClickMintButton = (image, name, category, title, datetime, description, place) => {
    setModalProps({
      title: "발행하시겠습니까?",
      onConfirm: () => {
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

    const randomTokenId = parseInt(Math.random() * 10000000);
    KlipAPI.mintCardWithURI(
      myAddress,
      randomTokenId,
      metadataURL,
      setQrvalue,
      (result) => {
        // alert(JSON.stringify(result));
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
      setTab(tabBefore)
    });
  };

  const onClickMarketCard = async (tokenId) => {
    const price = await getPriceOf(tokenId)

    KlipAPI.buyCard(tokenId, price, setQrvalue, (result) => {
      console.log(JSON.stringify(result));
      // alert("구매 완료되었습니다.")
      setTab(tabBefore)
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

        {tab === "WALLET" ? (
        // {/* 주소 잔고 */}
        <div>
          <div
            style={{
              fontSize: 30,
              fontWeight: "bold",
              paddingLeft: 5,
              marginTop: 10,
            }}
          >
            내 지갑
          </div>
          <div>{myAddress}</div>
          {myAddress !== DEFAULT_ADDRESS
            ? `${myBalance} KLAY`
            : "지갑 연동 안됨"}
        </div>
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
        {myAddress !== DEFAULT_ADDRESS && (tab === "MARKET" || tab === "WALLET") ? (
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
                    <Card.Img src={nfts[rowIndex * 2].uri.image} />
                      
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
            <div>
              <span style={{fontSize:22, width:273, fontWeight:"bold"}}>{nft.uri.title}</span> <br/><br/>
              <div>
                <span style={{float:"left", width:"30px"}}>{nft.uri.place}</span>
                {tabBefore === "MARKET" ? <span style={{fontSize:18, color:"#34CD75", fontWeight:"bold", float:"right", width:"100px"}}>{nft.price} KLAY</span> : null}
              </div>
              <br/><br/>
              <hr/>
              <span style={{fontWeight:"bold"}}>상세정보</span> <br/>
              <span>{nft.uri.description}</span> <br/><br/>
              <span style={{fontWeight:"bold"}}>카테고리</span> <br/>
              <span>{nft.uri.category == "dining" ? "식사" : (nft.uri.category == "class" ? "쿠킹 클래스" : "리미티드 예약")}</span> <br/><br/>
              <span style={{fontWeight:"bold"}}>모임일시</span> <br/>
              <span>{nft.uri.datetime}</span> <br/><br/>
              <hr/>
              <br/>
              <span style={{fontSize:18, fontWeight:"bold"}}>발행정보</span> <br/><br/>
              <span style={{fontWeight:"bold"}}>토큰ID</span> <br/>
              <span>{nft.id}</span><br/> <br/>
              <span style={{fontWeight:"bold"}}>컨트랙트 주소</span> <br/>
              <span>{MARKET_CONTRACT_ADDRESS}</span><br/><br/><br/>
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
            <div>
              <br/>
              <b style={{fontSize:"20px"}}>판매할 가격을 입력해주세요</b><br/><br/>
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
            </div><br/>
            <p>
              <span>가격 기준</span><br/>
              <span>1 KLAY = 1500 원</span><br/>
              <br/><br/>
              <span style={{fontSize:"18px", fontWeight:"bold"}}>티켓 정보</span><br/><hr/>
              <span>{nft.uri.place}</span><br/>
              <span>{nft.uri.title}</span><br/>
              <span>{nft.uri.description}</span><br/>
              <br/>
              <span style={{fontSize:"18px", fontWeight:"bold"}}>판매 수수료</span><br/><hr/>
              <span style={{float:"left", width:100}}>결제 금액</span>
              <span style={{float:"right", width:100}}>0.01 KLAY</span><br/><br/><br/><br/>
            </p>
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