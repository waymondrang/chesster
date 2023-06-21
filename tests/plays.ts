import { ChessterMove, PGNTest, Test, moveTypes } from "../types";
import { partialPieceArrayToBoard } from "../util";

export const tests: PGNTest[] = [
  {
    title: "fisher vs yanofsky",
    pgn: `[Event "Izt"]
    [Site "Stockholm (Sweden)"]
    [Date "1962.??.??"]
    [Round "?"]
    [White "Daniel Abraham Yanofsky"]
    [Black "Bobby Fischer"]
    [Result "0-1"]
    
    1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O
    O-O 9. Be3 Qc7 10. a4 Be6 11. f4 exf4 12. Rxf4 Nbd7 13. Nd5 Bxd5 14. exd5 Ne5
    15. a5 Rfe8 16. Bb6 Qc8 17. Bd3 Bd8 18. Bxd8 Qxd8 19. c4 b6 20. Bf1 Rb8 21. Qd4
    Ng6 22. Rf2 Ne4 23. Re2 Nc5 24. Rxe8+ Qxe8 25. Ra3 Nxb3 26. Rxb3 bxa5 27. Ra3
    Qd8 28. c5 Rb4 29. Qc3 dxc5 30. Qxc5 Rxb2 31. d6 Nf8 32. Qc7 Qxc7 33. dxc7 Rc2
    34. Rxa5 Rxc7 35. Rxa6 g6 36. Be2 Kg7 37. Bf3 Nd7 38. Kf2 Ne5 39. Ra3 Rc2+ 40.
    Kg3 Kf6 41. Be4 Rc4 42. Bf3 Kg5 43. Re3 f6 44. Re4 Rc3 45. Rf4 f5 46. h4+ Kf6
    47. Ra4 Nd3 48. Rd4 Nc5 49. Rd6+ Ke5 50. Rd5+ Ke6 51. Rd4 h6 52. Kf2 Nd3+ 53.
    Ke2 Nc5 54. Kf2 g5 55. hxg5 hxg5 56. Ke2 Nb3 57. Rd8 Rc2+ 58. Kd1 Rc1+ 59. Ke2
    Ke5 60. Re8+ Kf6 61. Rf8+ Kg6 62. Rg8+ Kh6 63. Bd5 Rc2+ 64. Ke3 Rc3+ 65. Kf2 Nc5
    66. Bf3 Nd7 67. Rd8 Nf6 68. Rd6 Kg7 69. Ke2 g4 70. Bb7 Nh5 71. Ke1 Re3+ 72. Kf2
    Rc3 73. Ke1 Re3+ 74. Kf2 Rb3 75. Ba8 Ng3 76. Ke1 Re3+ 77. Kd1 Ra3 78. Bb7 Ra2
    79. Rd4 Nh1 80. Ke1 Ra1+ 81. Ke2 Rg1 82. Rd6 Rb1 83. Ba8 Rb3 84. Rd3 Rb2+ 85.
    Ke1 Rb8 86. Bc6 Rb6 87. Ba8 f4 88. Rd4 Rf6 89. Bb7 Kg6 90. Rd8 Re6+ 91. Kd2 Nf2
    92. Rd4 Kg5 93. Ba8 Rf6 94. Ke1 Nh1 95. Rd8 Rb6 96. Rd4 Ng3 97. Kd2 Nf1+ 98. Ke2
    Ne3 99. Rd2 Kh4 100. Kf2 Rb3 101. Be4 Ra3 102. Bc6 Nf5 103. Rb2 Ra1 104. Rb4
    Ra2+ 105. Ke1 Kg3 106. Rb3+ Ne3 107. Be4 Kh2 108. Rb4 Nxg2+ 109. Bxg2 Kxg2 110.
    Rxf4 g3 111. Rg4 Kf3 112. Rg8 Ra1+ 0-1`,
    expectedState: {
      board: partialPieceArrayToBoard([
        {
          string: "♜",
          location: [0, 0],
        },
        {
          string: "♔",
          location: [4, 0],
        },
        {
          string: "♚",
          location: [5, 2],
        },
        {
          string: "♟︎",
          location: [6, 2],
        },
        {
          string: "♖",
          location: [6, 7],
        },
      ]),
    },
  },
];
