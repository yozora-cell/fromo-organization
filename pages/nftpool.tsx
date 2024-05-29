import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react'
import Footer from '@components/Footer'
import ItemGrid from '@components/ListItems/ItemGrid'
import NoData from '@components/NoData'
import { getNftPoolList } from 'packages/service/api'
import { INftList } from 'packages/service/api/types'
import { useEffect, useState } from 'react'

const NFTpool = () => {
  const [gameNft, setGameNft] = useState<INftList>({
    total: 0,
    nftList: [],
  })

  useEffect(() => {
    getNftPoolList(1).then((res) => {
      if (res) {
        setGameNft(res)
      }
    })
  }, [])

  return (
    <Box minH="calc(100vh - 85px)">
      {gameNft.nftList.length > 0 ? (
        <>
          <Box px="40px" minH="70vh">
            <Text mt="16px" fontSize="32px" fontWeight="800" lineHeight="36px">
              NFT Pool
            </Text>
            <SimpleGrid mt="52px" columns={[1, 2, 2, 3, 5, 6]} spacing="20px">
              {gameNft.nftList.map((item, idx) => {
                return (
                  <ItemGrid gridName="finishedList" item={item} key={idx} />
                )
              })}
            </SimpleGrid>
          </Box>
          <Footer />
        </>
      ) : (
        <Flex minH="70vh" justifyContent="center" alignItems="center">
          <NoData />
        </Flex>
      )}
    </Box>
  )
}

export default NFTpool
