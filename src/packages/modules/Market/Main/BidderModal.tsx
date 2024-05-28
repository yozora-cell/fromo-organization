import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Input,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'

import BaseModal from '@components/Modal'
import { ellipseAddress, formatNumberWithCommas } from '@utils'
import { toastError } from '@utils/toast'
import { ethers } from 'ethers'
import FroopyABI from 'packages/abis/demo/fl417.json'
import { getBidderForm } from 'packages/service/api'
import { IBidInfo } from 'packages/service/api/types'
import useStore from 'packages/store'
import { ActivityStatus } from 'packages/store/auctions'
import { web3Modal } from 'packages/web3'
import { useEffect, useMemo, useRef, useState } from 'react'

const FL_CONTRACT_ADR = process.env.NEXT_PUBLIC_FL_CONTRACT_ADR

let contract: any = null

type SubmitOfferModalProps = {
  status: number
  isOpen: boolean
  onClose: () => void
}

const BidModal = ({ status, isOpen, onClose }: SubmitOfferModalProps) => {
  const [value, setValue] = useState('')
  const [list, setList] = useState<IBidInfo[]>([])

  const [availableNums, setAvailableNums] = useState<any>()

  const scrollRef = useRef(null)
  const [bidLoading, setBidLoading] = useState(false)

  const { address } = useStore()

  const isLowPrice = useMemo(
    () => list.some((k) => Number(value) <= Number(k.amount)),
    [list, value],
  )

  const bidList = useMemo(
    () => list.slice().sort((a, b) => Number(b.amount) - Number(a.amount)),
    [list],
  )

  const handleBid = async () => {
    if (!value) return toastError('Please bid the price.')

    if (isLowPrice)
      return toastError('Bid must be higher than the current highest bid.')

    if (parseFloat(value) > parseFloat(availableNums))
      return toastError(
        'Bid must be lower than the current available $OMO Token',
      )

    try {
      setBidLoading(true)

      if (!contract) {
        const provider = await web3Modal.connect()
        const library = new ethers.providers.Web3Provider(provider)
        const signer = library.getSigner()

        contract = new ethers.Contract(FL_CONTRACT_ADR, FroopyABI, signer)
      }

      await contract.bidLand(ethers.utils.parseEther(value), {
        gasLimit: BigInt(500000),
      })
      // const existingItemIndex = bidList.findIndex(item => item.userAddress === address)

      // if (existingItemIndex !== -1) {
      //   const updatedBidList = [...bidList]
      //   updatedBidList[existingItemIndex].amount = parseFloat(value)
      //   setList(updatedBidList)
      // } else {
      //   setList(prevList => [...prevList, {
      //     amount: parseFloat(value),
      //     userAddress: address,
      //   }])
      // }
    } catch (error) {
      setBidLoading(false)
      console.log(error, '<===')
    }
  }

  const getAvailableFL = async () => {
    const provider = await web3Modal.connect()
    const library = new ethers.providers.Web3Provider(provider)
    const signer = library.getSigner()

    if (!contract) {
      contract = new ethers.Contract(FL_CONTRACT_ADR, FroopyABI, signer)
    }

    contract = new ethers.Contract(FL_CONTRACT_ADR, FroopyABI, signer)

    const address = await signer.getAddress()

    if (!address) return toastError('Please connect wallet first.')

    try {
      const tx = await contract.getBidderInfoOf(address)
      setAvailableNums(
        ethers.utils.formatEther(tx.withdrawableAmount.toString()),
      )
    } catch (error) {
      console.log(error, '<====getAvailableFL')
    }
  }

  const registerUpdateSOL = async () => {
    if (!contract) {
      const provider = await web3Modal.connect()
      const library = new ethers.providers.Web3Provider(provider)
      const signer = library.getSigner()

      contract = new ethers.Contract(FL_CONTRACT_ADR, FroopyABI, signer)
    }

    console.log('registerUpdateSOL')

    contract.on('NewBids', (Bidder, amount, bidId) => {
      console.log(
        Bidder,
        amount.toString(),
        bidId.toString(),
        'Bidder, amount, bidId',
      )
      getBidList().finally(() => setBidLoading(false))
    })
  }

  const removeListener = () => {
    if (contract) {
      contract.removeAllListeners('NewBids')
    }
  }

  const getBidList = async () => {
    const data = await getBidderForm()
    setList(data)
  }

  useEffect(() => {
    getAvailableFL()
    getBidList()
    registerUpdateSOL()
  }, [])

  return (
    <BaseModal
      variant="bidModal"
      size="2xl"
      isOpen={isOpen}
      title={
        <Heading
          color="white"
          fontSize="28px"
          lineHeight="32px"
          textAlign="left"
          pb="20px"
          fontWeight="800">
          Bid on this Plot of FROMO
        </Heading>
      }
      onClose={() => {
        removeListener()
        onClose()
      }}
      bgColor="#2F2B50">
      <VStack align="left">
        <Text lineHeight="20px" color="rgba(255,255,255,0.8)" mb="32px">
          The highest bidder will have the opportunity to auction their NFT in
          the next round.
        </Text>
        <Box>
          {bidList.length > 0 && (
            <Flex>
              <Text
                w="178px"
                align="left"
                mr="82px"
                color="rgba(255,255,255,0.6)">
                BIDDER
              </Text>
              <Text color="rgba(255,255,255,0.6)">BID</Text>
            </Flex>
          )}
          <Box
            overflowY="auto"
            height={bidList.length === 0 ? 0 : '220px'}
            ref={scrollRef}>
            {bidList.map((item, v) => (
              <Flex key={item.userAddress} py="10px" align="center" mb="10px">
                <Flex align="center" w="200px" mr="60px">
                  <Image
                    mr="12px"
                    borderRadius="full"
                    src="/static/account/sidebar/avatar.svg"
                    alt="avatar"
                    w="24px"
                    h="24px"
                  />
                  <Box color="white" fontSize="16px" w="160px">
                    {ellipseAddress(item.userAddress, 6)}
                  </Box>
                </Flex>
                <Text
                  align="left"
                  flex={1}
                  fontSize="16px"
                  color="white"
                  fontWeight="600">
                  {parseFloat(`${item.amount}`).toFixed(4)} $OMO Token
                </Text>

                {item.userAddress === address && (
                  <Flex alignItems="center" gap="4px">
                    <Image
                      src="/static/common/arrow-left.svg"
                      alt=""
                      w="10px"
                      h="20px"
                    />
                    <Text color="#1DFED6" fontWeight="600">
                      ME
                    </Text>
                  </Flex>
                )}
              </Flex>
            ))}
          </Box>
        </Box>
        <Flex
          gap="20px"
          alignItems="center"
          align="baseline"
          visibility={
            status && status === ActivityStatus.Bidding ? 'visible' : 'hidden'
          }>
          <Flex
            px="20px"
            py="16px"
            h="56px"
            borderRadius="8px"
            alignItems="center"
            bg="#0B063B">
            <Text color="rgba(255,255,255,0.6)">Bid:</Text>
            <Input
              _focusVisible={{
                borderWidth: '0px',
              }}
              type="number"
              color="white"
              fontSize="20px"
              fontWeight="600"
              border="none"
              onChange={(e) => setValue(e.target.value)}
            />
            <Text
              color="rgba(255,255,255,0.4)"
              fontSize="20px"
              fontWeight="600"
              lineHeight="24px">
              $OMO
            </Text>
          </Flex>
          <Button
            w="160px"
            h="56px"
            borderRadius="8px"
            fontSize="20px"
            fontWeight="600"
            color="#222222"
            bg="#1DFED6"
            _hover={{ bg: '#1DFED6' }}
            onClick={handleBid}
            disabled={availableNums <= 0 || bidLoading}
            isLoading={bidLoading}>
            Bid
          </Button>
        </Flex>
        <Flex
          mt="8px"
          fontSize="12px"
          lineHeight="16px"
          color="rgba(255,255,255,0.6)">
          Available：
          <Text mr="4px" fontWeight="600">
            {' '}
            {formatNumberWithCommas(availableNums)}{' '}
          </Text>{' '}
          $OMO Token
        </Flex>
        <Flex bg="#4C467B" py="16px" px="20px" borderRadius="12px" mt="20px">
          <Image
            src="/static/common/info.svg"
            alt="info"
            w="16px"
            h="16px"
            mr="12px"
          />
          <Text
            textAlign="justify"
            color="white"
            fontSize="14px"
            lineHeight="21px"
            mt="-5px">
            The $OMO you bid is used to purchase the FROMO plot. It will be
            locked until the bidding ends. If you lose the FROMO plot, it will
            be unlocked after the bidding ends. The FROMO plot winner who failed
            to stake NFT will lose the $OMO he/she bid.
          </Text>
        </Flex>
      </VStack>
    </BaseModal>
  )
}

export default BidModal
