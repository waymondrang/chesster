import { ChessterMove, PGNTest, Test, moveTypes } from "../types";
import { partialPieceArrayToBoard, pieceArrayToBoard } from "../util";

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
  {
    title: "kasparov vs yusupov",
    pgn: `[Event "It"]
    [Site "Linares (Spain)"]
    [Date "1993.??.??"]
    [Round "?"]
    [White "Garry Kasparov"]
    [Black "Artur Yusupov"]
    [Result "1/2-1/2"]
    
    1. d4 d5 2. c4 e6 3. Nc3 Be7 4. cxd5 exd5 5. Bf4 Nf6 6. e3 Bf5 7. Nge2 O-O 8.
    Ng3 Be6 9. Bd3 c5 10. dxc5 Bxc5 11. O-O Nc6 12. Rc1 Bd6 13. Nh5 Be7 14. Nb5 Nxh5
    15. Qxh5 g6 16. Qf3 Rc8 17. Rfd1 Qd7 18. h3 Rfd8 19. Qg3 Nb4 20. Nc3 Nxd3 21.
    Rxd3 Bf5 22. Rd2 Qe6 23. Rcd1 h5 24. h4 Rc5 25. f3 Qc6 26. e4 Rxc3 27. bxc3 Qb6+
    28. Kh2 dxe4 29. Rxd8+ Bxd8 30. Be3 Qa5 31. Qb8 Qc7+ 32. Qxc7 Bxc7+ 33. Kg1 exf3
    34. gxf3 b6 35. Kf2 Kf8 36. Rd4 Ke7 37. Bf4 Bxf4 38. Rxf4 Kd6 39. Ke3 Kc5 40.
    Rd4 Be6 41. a3 a5 42. Ke4 b5 43. Ke5 a4 44. f4 Kc6 45. Kf6 Kc5 46. Rb4 Bc4 47.
    Ke7 Be6 48. Re4 Kd5 49. Rd4+ Kc6 50. Kd8 Bf5 51. Ke8 Be6 52. Kf8 Kc5 53. Kg7 Kc6
    54. Kg8 Kc5 55. Kf8 Kc6 56. Kg7 Kc5 57. Kh8 Kc6 58. Kh7 Kc5 59. Kh6 Bf5 60. Kg5
    Be6 61. Kf6 Kc6 62. f5 Bxf5 63. Kxf7 Kc5 64. Kf6 Bc2 65. Ke7 Bf5 66. Kd8 Kc6 67.
    Rf4 Kd6 68. Rb4 Kc5 69. Kc7 Bd3 70. Rd4 Be2 71. Kb7 Bf1 72. Ka7 Be2 73. Re4 Bd3
    74. Rb4 Bc4 75. Ka6 Kd5 76. Ka5 Ke5 77. Rb1 g5 78. hxg5 Kf5 79. Rg1 Kg6 80. Kb4
    h4 81. Kc5 h3 82. Kd4 Be6 83. Ke5 Bd7 84. Kf4 Bc6 85. Kg3 Kxg5 86. Rd1 h2 87.
    Kxh2 Kf4 88. c4 bxc4 89. Rd4+ Ke5 90. Rxc4 Kd5 91. Rb4 Kc5 92. Kg3 Bb5 93. Kf4
    Kb6 94. Ke3 Ka5 95. Kd4 Be2 96. Rb1 Bh5 97. Re1 Bf7 98. Kc5 Bb3 99. Re8 Ka6 100.
    Kc6 Ka7 101. Kb5 Kb7 102. Re7+ Kc8 103. Kc6 Kd8 104. Rd7+ Ke8 105. Kc7 Bc2 106.
    Rd2 Bb3 107. Re2+ Kf7 108. Kd6 Bc4 109. Re7+ Kf8 110. Re4 Bb3 111. Kd7 Kf7 112.
    Rf4+ Kg6 113. Kd6 Kg5 114. Ke5 Kg6 115. Rf3 Kg7 116. Rf6 Bc4 117. Kf5 Bb3 118.
    Kg5 Bc2 1/2-1/2`,
    expectedState: {
      board: partialPieceArrayToBoard([
        {
          string: "♟︎",
          location: [0, 3],
        },
        {
          string: "♙",
          location: [0, 2],
        },
        {
          string: "♝",
          location: [2, 1],
        },
        {
          string: "♖",
          location: [5, 5],
        },
        {
          string: "♚",
          location: [6, 6],
        },
        {
          string: "♔",
          location: [6, 4],
        },
      ]),
    },
  },
  {
    title: "nakamura vs chen",
    pgn: `[Event "It (cat.13)"]
    [Site "Wijk aan Zee (Netherlands)"]
    [Date "2004.??.??"]
    [Round "?"]
    [White "Hikaru Nakamura"]
    [Black "Chen Zhu"]
    [Result "1/2-1/2"]
    
    1. d4 d5 2. c4 c6 3. Nc3 Nf6 4. Nf3 e6 5. e3 Nbd7 6. Qc2 Bd6 7. g4 Bb4 8. Bd2
    Qe7 9. Rg1 Bxc3 10. Bxc3 Ne4 11. O-O-O O-O 12. Bd3 Nxc3 13. Qxc3 dxc4 14. Qxc4
    e5 15. Bf5 exd4 16. Qxd4 Qc5+ 17. Kb1 Qxd4 18. Rxd4 Nb6 19. Bc2 g6 20. h3 f5 21.
    Rg3 Kg7 22. a4 c5 23. Rf4 Nd5 24. Rc4 fxg4 25. hxg4 b6 26. Re4 Bb7 27. Re5 Rae8
    28. Rxe8 Rxe8 29. Nd2 Nb4 30. f4 Rd8 31. Kc1 a6 32. Bb1 Bc6 33. b3 Nd5 34. Ne4
    Re8 35. f5 Re5 36. Kd2 h6 37. a5 Nb4 38. Nc3 bxa5 39. e4 Kf6 40. Rf3 Be8 41. Ne2
    Kg5 42. Rf1 Bf7 43. Nf4 gxf5 44. gxf5 c4 45. Ng6 Rc5 46. Rg1+ Kf6 47. e5+ Rxe5
    48. Nxe5 Kxe5 49. bxc4 Bxc4 50. Rh1 Bd5 51. Rxh6 Nc6 52. Rh5 Ne7 53. Kc3 Bf3 54.
    Rh3 Nd5+ 55. Kc4 Nb6+ 56. Kb3 Bd1+ 57. Kb2 Nd5 58. Rh1 Bg4 59. Re1+ Kf4 60. Re4+
    Kg5 61. Re6 Kf4 62. Re4+ Kg5 63. Re5 Nb6 64. Kc3 a4 65. Re6 Nd5+ 66. Kd4 Nf4 67.
    Re5 Ne2+ 68. Kc5 a3 69. Kd6 Nd4 70. Ra5 Kf6 71. Rxa6 Bxf5 72. Ba2 Bd3 73. Ra7
    Nf5+ 74. Kd5 Ne7+ 75. Kd4 Bf5 76. Ra6+ Kg5 77. Bc4 Ng6 78. Rxa3 Kf4 79. Bd5 Ne7
    80. Bb7 Kg5 81. Rg3+ Kf6 82. Rf3 Ke6 83. Rf1 Kf6 84. Kc5 Kg5 85. Kd6 Ng6 86. Bc6
    Kg4 87. Rg1+ Kf4 88. Rf1+ Kg5 89. Rg1+ Kf4 90. Be8 Nh4 91. Bh5 Nf3 92. Rg8 Be4
    93. Rb8 Ke3 94. Rb4 Nd4 95. Ra4 Nf3 96. Kc5 Ne5 97. Ra1 Nf3 98. Kc4 Kf4 99. Kc3
    Nh4 100. Kd2 Nf5 101. Bg6 Ke5 102. Ra4 Nd6 103. Bh5 Nf5 104. Bg4 Kf4 105. Bh3
    Ke5 106. Ke2 Ne7 107. Ra6 Nd5 108. Kd2 Kd4 109. Ra5 Ke5 110. Bf1 Kd4 111. Ra4+
    Ke5 112. Be2 Nf4 113. Bc4 Nd5 114. Ba2 Ne7 115. Ra6 Nd5 116. Rh6 Kd4 117. Bb3
    Ke5 118. Rh4 Ne7 119. Bc4 Nf5 120. Rg4 Ne7 121. Bd3 Bxd3 122. Kxd3 Nf5 123. Ra4
    Ng3 124. Ra8 Nf5 125. Ra4 Ng3 126. Rg4 Nf5 127. Re4+ Kd5 128. Re1 Nd6 129. Ra1
    Ke5 130. Ra5+ Kf4 131. Rc5 Nf5 132. Rd5 Ng3 133. Ra5 Nf5 134. Kc4 Ke4 135. Ra4
    Ke5 136. Kc5 Ng3 137. Ra5 Ne4+ 138. Kc6+ Kd4 139. Ra4+ Ke5 140. Ra5+ Kd4 141.
    Rh5 Nf6 142. Rh1 Ne4 143. Kd7 Ke5 144. Rh5+ Kd4 145. Ra5 Nc5+ 146. Kc7 Ne4 147.
    Kc6 Nf6 148. Rf5 Ne4 149. Rd5+ Kc4 150. Rd8 Nc3 151. Ra8 Kd4 152. Kd6 Nb5+ 153.
    Kd7 Nc3 154. Ke6 Kc4 155. Rc8+ Kd4 156. Rd8+ Ke4 157. Rh8 Kd4 158. Rh4+ Kc5 159.
    Rg4 Nb5 160. Rg8 Nd4+ 161. Ke5 Nc6+ 162. Ke4 Kd6 163. Rg5 Nb4 164. Rh5 Nc6 165.
    Rb5 Ne7 166. Ra5 Nc6 167. Rd5+ Ke6 168. Rd1 Ne7 169. Kd4 Nf5+ 170. Kc5 Ke5 171.
    Re1+ Kf4 172. Re8 Ne3 173. Kd4 Nf5+ 174. Kd3 Nd6 175. Re6 Nf5 176. Re4+ Kf3 177.
    Ra4 Ng3 178. Kd4 Kf4 179. Kd5+ Kf3 180. Ke5 Ke2 181. Kf4 Nf1 182. Ra3 1/2-1/2`,
    expectedState: {
      board: partialPieceArrayToBoard([
        {
          string: "♖",
          location: [0, 2],
        },
        {
          string: "♞",
          location: [5, 0],
        },
        {
          string: "♚",
          location: [4, 1],
        },
        {
          string: "♔",
          location: [5, 3],
        },
      ]),
    },
  },
  {
    title: "morphy vs isouard",
    pgn: `[Event "Paul Morphy - Duke Karl Count Isouard (1858.??.??)"]
    [Site "Paris (France)"]
    [Date "1858.??.??"]
    [Round "?"]
    [White "Paul Morphy"]
    [Black "Duke of Brunswick and Count Isouard"]
    [Result "1-0"]
    
    1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8.
    Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14.
    Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`,
    expectedState: {
      board: partialPieceArrayToBoard([
        {
          string: "♙",
          location: [0, 1],
        },
        {
          string: "♙",
          location: [1, 1],
        },
        {
          string: "♙",
          location: [2, 1],
        },
        {
          string: "♙",
          location: [5, 1],
        },
        {
          string: "♙",
          location: [6, 1],
        },
        {
          string: "♙",
          location: [7, 1],
        },
        {
          string: "♙",
          location: [4, 3],
        },
        {
          string: "♔",
          location: [2, 0],
        },
        {
          string: "♗",
          location: [6, 4],
        },
        {
          string: "♖",
          location: [3, 7],
        },
        {
          string: "♟︎",
          location: [0, 6],
        },
        {
          string: "♟︎",
          location: [5, 6],
        },
        {
          string: "♟︎",
          location: [6, 6],
        },
        {
          string: "♟︎",
          location: [7, 6],
        },
        {
          string: "♟︎",
          location: [4, 4],
        },
        {
          string: "♞",
          location: [1, 7],
        },
        {
          string: "♛",
          location: [4, 5],
        },
        {
          string: "♚",
          location: [4, 7],
        },
        {
          string: "♝",
          location: [5, 7],
        },
        {
          string: "♜",
          location: [7, 7],
        },
      ]),
      white: {
        checked: false,
        checkmated: false,
      },
      black: {
        checked: true,
        checkmated: true,
      },
    },
  },
];
