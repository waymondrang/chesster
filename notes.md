### bit representation

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

| move                       | bit pattern |
| -------------------------- | ----------- |
| move                       | 0000        |
| double pawn push           | 0001        |
| capture                    | 0010        |
| castle (king side)         | 0011        |
| castle (queen side)        | 0100        |
| en passant (white)         | 0101        |
| en passant (black)         | 0110        |
| (unused)                   | 0111        |
| promotion (queen)          | 1000        |
| promotion (knight)         | 1001        |
| promotion (bishop)         | 1010        |
| promotion (rook)           | 1011        |
| promotion capture (queen)  | 1100        |
| promotion capture (knight) | 1101        |
| promotion capture (bishop) | 1110        |
| promotion capture (rook)   | 1111        |

| team  | bit value |
| ----- | --------- |
| white | 0         |
| black | 1         |

| bcqc | wcqc | bckc | wckc | bit value |
| ---- | ---- | ---- | ---- | --------- |
| 1    | 1    | 1    | 1    | 000       |
| 1    | 1    | 1    | 0    | 001       |
| 1    | 1    | 0    | 1    | 010       |
| 1    | 0    | 1    | 1    | 011       |
| 0    | 1    | 1    | 1    | 100       |
| 1    | 0    | 1    | 0    | 101       |
| 0    | 1    | 0    | 1    | 110       |
| 0    | 0    | 0    | 0    | 111       |

\[piece (3 bits)\]\[team (1 bit)\]

### move bit representation

location: 6 bits (0 to 63)

total: (20 bits)
\[move from (6 bits from 0 to 63)\] (14)
\[move to (6 bits from 0 to 63)\] (8)
\[move type (4 bits)\] (4)
\[original piece (4 bits)\] (0)

(in history)
\[bcqc bit\] (31)
\[wcqc bit\] (30)
\[bckc bit\] (29)
\[wckc bit\] (28)
\[bcm bit\] (27)
\[wcm bit\] (26)
\[bc bit\] (25)
\[wc bit\] (24)
\[captured piece, if any (4 bits)\] (20)
\[move from (6 bits from 0 to 63)\] (14)
\[move to (6 bits from 0 to 63)\] (8)
\[move type (4 bits)\] (4)
\[original piece (4 bits)\] (0)

1 0 0 0 0 0 0000 110001 111000 1010 0011
56 bishop capture bp

(not used)
\[will check (1 bit)\]\[move location (6 bits from 0 to 63)\]\[move type (4 bits)\]\[original piece (4 bits)\]

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

### board bit representation

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

### iteration/data type results

```
uint8: 658.7679600119591ms
uint32: 661.0946100115776ms
buffer: 652.7213200330734ms
arrayFor: 622.7894200086594ms
arrayWhile: 607.817779994011ms
nestedArrayTestWhile: 723.1028299808502ms
chessterBoard: 0ms
```

```
uint8: 683.5581399798393ms
uint32: 672.319019985199ms
buffer: 677.8230999946594ms
arrayFor: 648.0823300004006ms
arrayWhile: 619.2686400175095ms
arrayPushWhile: 643.2715700149536ms
nestedArrayTestWhile: 716.3691900014877ms
```

arrayWhile is clearly the winner!

### getWhihteKingMoves

using only if statements

```
liveGenerateMoveTest: 1000000 iterations took 6626.551499962807ms
liveGenerateMoveTest: 1000000 iterations took 6988.545799970627ms
liveGenerateMoveTest: 1000000 iterations took 6437.332000017166ms
liveGenerateMoveTest: 1000000 iterations took 6421.122200012207ms
liveGenerateMoveTest: 1000000 iterations took 6447.907799959183ms
liveGenerateMoveTest: 1000000 iterations took 6424.315500020981ms
liveGenerateMoveTest: 1000000 iterations took 6474.685600042343ms
liveGenerateMoveTest: 1000000 iterations took 6424.331400036812ms
liveGenerateMoveTest: 1000000 iterations took 6411.646800041199ms
liveGenerateMoveTest: 1000000 iterations took 6536.028600096703ms
preGenerate: 0ms
liveGenerate: 6519.246720016003ms
```

using bitwise and loop

```
liveGenerateMoveTest: 1000000 iterations took 6689.716600060463ms
liveGenerateMoveTest: 1000000 iterations took 6601.729099988937ms
liveGenerateMoveTest: 1000000 iterations took 6713.074100017548ms
liveGenerateMoveTest: 1000000 iterations took 6500.011300086975ms
liveGenerateMoveTest: 1000000 iterations took 6548.257400035858ms
liveGenerateMoveTest: 1000000 iterations took 6611.903599977493ms
liveGenerateMoveTest: 1000000 iterations took 6514.960600018501ms
liveGenerateMoveTest: 1000000 iterations took 6569.82539999485ms
liveGenerateMoveTest: 1000000 iterations took 6515.367999911308ms
liveGenerateMoveTest: 1000000 iterations took 6565.6209000349045ms
preGenerate: 0ms
liveGenerate: 6583.046700012684ms
```

### todo tests

- compare (location & 0b111000) !== 0b111000 vs (location >> 3) !== 7
