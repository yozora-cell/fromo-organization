import styles from './index.module.scss'
import {
  Box,
  Image,
  List,
  ListItem,
  Link,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Stack,
  StackDivider,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Flex,
  Text,
  Progress,
  Button
} from '@chakra-ui/react'
import { ArrowBackIcon } from '@chakra-ui/icons'
import useCountDown from '@hooks/useCountDown'
import { web3Modal } from 'packages/web3'
import { ethers } from 'ethers'
import { useRouter } from 'next/router'
import useFomoStore from 'packages/store/fomo'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import FroopyABI from 'packages/abis/demo/FroopyLand.json'
import { toastSuccess } from '@utils/toast'


const Details = () => {
  const router = useRouter()
  const { gameList } = useFomoStore()
  
  const { pool: id } = router.query

  const [detail, setDetail] = useState(gameList[0])

  useEffect(() => {
    const { pool: id } = router.query
    setDetail(gameList[`${id}`])
    console.log(detail, '<===47')
    
  }, [id, gameList, router.query])

  const localTimeFormatted = useMemo(() => {
    if (!detail?.state) {
      return null
    }
    const date =  detail.state === 0 ? detail['startTimestamp'].toNumber() : detail['endTime']
    return moment(date*1000).format('YYYY-MM-DD HH:mm:ss')
  }, [detail])

  const time = useCountDown(localTimeFormatted)

  const buyKey = async () => {
    const provider = await web3Modal.connect()
    const library = new ethers.providers.Web3Provider(provider)
    const signer = library.getSigner()
    const contract = new ethers.Contract('0x49b775262e272bED00B6Cf0d07a5083a7eeFe19E', FroopyABI, signer)
    const address = await signer.getAddress()
    
    try {
      const tx = await contract.purchaseKeyOfGameId(id, {
        value: ethers.utils.parseUnits(`${detail.keyPrice}`, "wei"),
        gasLimit: BigInt(500000)
      })
      const receipt = await tx.wait()
      console.log(receipt, 'receipt')
    } catch (error) {
      console.log(error, '<=-===222')
    }
  }

  const claim = async () => {
    const provider = await web3Modal.connect()
    const library = new ethers.providers.Web3Provider(provider)
    const signer = library.getSigner()
    const contract = new ethers.Contract('0x49b775262e272bED00B6Cf0d07a5083a7eeFe19E', FroopyABI, signer)
    const address = await signer.getAddress()

    try {
      const tx = await contract.claimBonus([id], address)
      await tx.wait()
      toastSuccess('Claim success')
    } catch (error) {
      console.log(error, '<=-===222')
    }
  }

  const { days, hours, minutes, seconds } = time

  if (!detail?.nftName) return null
  
  return (
    <>
      <Flex w='100px' cursor='pointer' alignItems='center' padding='0 20px' onClick={() => router.back()}><ArrowBackIcon mr='10px' /><Text fontSize='20px'>Back</Text></Flex>
      <Box className={styles.box}>
        <Box className={styles.nft}>
          <Box>
            <Image
              w="720px"
              h="720px"
              objectFit="cover"
              borderRadius="8px"
              alt=""
              src={detail?.nftImage}
              fallbackSrc="/static/license-template/template.png"
            />
          </Box>
          <Text className={styles.desc}>Description</Text>
          <List spacing={3}>
            <ListItem>
              <span className={styles.name}>NFT Name：</span>
              {detail.nftName}
            </ListItem>
            <ListItem>
              <span className={styles.name}>NFT Address：</span>
              <Link color="#00DAB3">{detail.nftAddress}</Link>
            </ListItem>
            <ListItem>
              <span className={styles.name}>NFT ID：</span>
              {detail.nftId.toNumber()}
            </ListItem>
          </List>
        </Box>
        <Box className={styles.info}>
          <Card
            color="#fff"
            boxShadow="0 1px 3px 0 rgb(255, 255, 255),0 1px 2px 0 rgb(255, 255, 255)">
            <CardHeader>
              <Heading size="lg">Game Info</Heading>
            </CardHeader>
            <CardBody>
              <Stack divider={<StackDivider />} spacing="4">
                <Box>
                  <Heading size="md">Sale ends at</Heading>
                  {
                    // 2 已经结束
                    detail.state === 2 && (
                      <div className={styles.time}>已结束</div>
                    )
                  }
                 {
                  [0, 1].includes(detail.state) && (
                    <div className={styles.time}>
                      <div className={styles.unit}>{days || '0'}</div>
                      <div className={styles.symbol}>天</div>
                      <div className={styles.unit}>{hours || '0'}</div>
                      <div className={styles.symbol}>时</div>
                      <div className={styles.unit}>{minutes || '0'}</div>
                      <div className={styles.symbol}>分</div>
                      <div className={styles.unit}>{seconds || '0'}</div>
                      <div className={styles.symbol}>秒</div>
                    </div>
                  )
                 }
                </Box>
              </Stack>
            </CardBody>
          </Card>
          <Card
            marginTop='20px'
            paddingBottom='20px'
            color="#fff"
            boxShadow="0 1px 3px 0 rgb(255, 255, 255),0 1px 2px 0 rgb(255, 255, 255)">
            <CardHeader>
              <Heading size="lg">Player information</Heading>
            </CardHeader>
            <CardBody>
              <Box>
                <Heading size="md" marginBottom='10px'>Sale information</Heading>
                <StatGroup>
                  <Stat>
                    <StatLabel>UnClaim Bonus</StatLabel>
                    <StatNumber>29,000</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Key Num</StatLabel>
                    <StatNumber>29,000</StatNumber>
                  </Stat>
                </StatGroup>
              </Box>
              <Box marginTop='20px'>
                  <Flex
                      flexDirection={{ base: 'column', lg: 'row' }}
                      gap={{ base: '10px', lg: '30px', xl: '110px' }}
                      alignItems={{ xl: 'center' }}
                      justifyContent='space-between'
                      py={{ base: '5px', lg: 'none' }}>
                      <Text fontSize="20px" fontWeight="500" textColor="#fff">51.2% Keys</Text>
                  </Flex>
                  <Progress colorScheme="green" borderRadius='5px' marginTop='8px' size='sm' value={20} />
              </Box>
              <Box marginTop='20px' color='#fff' padding='0'>
                  <Flex marginTop='20px'>Current Price: <Text marginLeft='10px' fontWeight='600'>{detail.keyPrice.toNumber()}</Text></Flex>
                  <Button fontSize="20px" colorScheme='teal' w='200px' marginRight='20px' marginTop="40px" onClick={buyKey}>Buy Key</Button>
                  <Button fontSize="20px" colorScheme='teal' w='200px' marginTop="40px"  onClick={claim}>Claim Bonus</Button>
              </Box>
            </CardBody>
          </Card>
        </Box>
      </Box>
    </>

  )
}

export default Details
