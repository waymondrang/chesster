### todo

- [] miniMax is currently broken because of modified evaluation function. restore previous evaluation function
- [] settings font size is not responsive

### piece representation

| piece      | bit pattern |
| ---------- | ----------- |
| empty cell | 000         |
| pawn       | 001         |
| knight     | 010         |
| bishop     | 011         |
| rook       | 100         |
| queen      | 101         |
| king       | 110         |
| (unused)   | 111         |

| team  | bit value |
| ----- | --------- |
| white | 0         |
| black | 1         |

\*_4 bits total, team being least significant bit_

### move representation

| data      | # of bits | start |
| --------- | --------- | ----- |
| move from | 6         | 14    |
| move to   | 6         | 8     |
| move type | 4         | 4     |
| piece     | 4         | 0     |

\*_20 bits total_

### move type representation

| move type                  | bit pattern |
| -------------------------- | ----------- |
| move                       | 0000        |
| castle (king side)         | 0001        |
| castle (queen side)        | 0010        |
| double pawn push           | 0011        |
| capture                    | 0100        |
| en passant (white)         | 0101        |
| en passant (black)         | 0110        |
| (unused)                   | 0111        |
| promotion (knight)         | 1000        |
| promotion (bishop)         | 1001        |
| promotion (rook)           | 1010        |
| promotion (queen)          | 1011        |
| promotion capture (knight) | 1100        |
| promotion capture (bishop) | 1101        |
| promotion capture (rook)   | 1110        |
| promotion capture (queen)  | 1111        |

\*_the last two bits in the promotion can be used to determine the promotion piece by adding 2_

### history representation

| data           | # of bits | start |
| -------------- | --------- | ----- |
| bcqc           | 1         | 31    |
| wcqc           | 1         | 30    |
| bckc           | 1         | 29    |
| wckc           | 1         | 28    |
| bcm            | 1         | 27    |
| wcm            | 1         | 26    |
| bc             | 1         | 25    |
| wc             | 1         | 24    |
| captured piece | 4         | 20    |
| move from      | 6         | 14    |
| move to        | 6         | 8     |
| move type      | 4         | 4     |
| original piece | 4         | 0     |

\*_32 bits total_

### default starting position representation

| 0    | 1    | 2    | 3    | 4    | 5    | 6    | 7 ... |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ----- |
| 1001 | 0101 | 0111 | 1011 | 1101 | 0111 | 0101 | 1001  |
| 1001 | 1001 | 1001 | 1001 | 1001 | 1001 | 1001 | 1001  |
| 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000  |
| 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000  |
| 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000  |
| 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000  |
| 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000  |
| 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000  |
| 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000  |
| 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000 | 0000  |
| 1000 | 1000 | 1000 | 1000 | 1000 | 1000 | 1000 | 1000  |
| 1000 | 0100 | 0110 | 1010 | 1100 | 0110 | 0100 | 1000  |

### board reference

60 x 4 bit pieces

|     | 0      | 1      | 2      | 3      | 4      | 5      | 6      | 7 ...  |
| --- | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| 0   | 000000 | 000001 | 000010 | 000011 | 000100 | 000101 | 000110 | 000111 |
| 8   | 001000 | 001001 | 001010 | 001011 | 001100 | 001101 | 001110 | 001111 |
| 16  | 010000 | 010001 | 010010 | 010011 | 010100 | 010101 | 010110 | 010111 |
| 24  | 011000 | 011001 | 011010 | 011011 | 011100 | 011101 | 011110 | 011111 |
| 32  | 100000 | 100001 | 100010 | 100011 | 100100 | 100101 | 100110 | 100111 |
| 40  | 101000 | 101001 | 101010 | 101011 | 101100 | 101101 | 101110 | 101111 |
| 48  | 110000 | 110001 | 110010 | 110011 | 110100 | 110101 | 110110 | 110111 |
| 56  | 111000 | 111001 | 111010 | 111011 | 111100 | 111101 | 111110 | 111111 |

### fen strings

rn3k1r/p1Bp2p1/5ppn/6N1/3pQ3/8/PP2PPPP/4KB1R w K - 4 21

### bulk counting results

Depth: 1 Number of positions: 20 Number of captures: 0 Number of checks: 0 Number of checkmates: 0 Number of stalemates: 0 Time: 4.611100003123283ms
Depth: 2 Number of positions: 400 Number of captures: 0 Number of checks: 0 Number of checkmates: 0 Number of stalemates: 0 Time: 24.368000000715256ms
Depth: 3 Number of positions: 8902 Number of captures: 34 Number of checks: 12 Number of checkmates: 0 Number of stalemates: 0 Time: 83.79879999905825ms
Depth: 4 Number of positions: 197281 Number of captures: 1576 Number of checks: 469 Number of checkmates: 8 Number of stalemates: 0 Time: 1421.0551000013947ms
Depth: 5 Number of positions: 4865609 Number of captures: 82719 Number of checks: 27351 Number of checkmates: 347 Number of stalemates: 0 Time: 33937.21069999784ms
Depth: 6 Number of positions: 119060324 Number of captures: 2812008 Number of checks: 809099 Number of checkmates: 10828 Number of stalemates: 0 Time: 1045469.0795999989ms
Depth: 7 Number of positions: 3195904244 Number of captures: 108329926 Number of checks: 33103848 Number of checkmates: 435767 Number of stalemates: 0 Time: 25288350.737400003ms\*

\*the bug in this depth is believed to be fixed
