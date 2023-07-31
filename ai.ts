import { ChessterGame } from "./game";
import { getPawnStructureMG } from "./pawns";
import {
  BLACK,
  ChessterMove,
  MAX_PLAYER,
  MIN_PLAYER,
  WHITE,
  boardSize,
  messageTypes,
  moveTypes,
  pieces,
} from "./types";
import { moveToString } from "./util";

const mobilityWeight = 1; // used in calculateAbsolute
const pieceValueWeight = 1; // used in calculateRelative
const teamPieceValueWeight = 20; // used in calculateAbsolute
const enemyPieceValueWeight = 20; // used in calculateAbsolute
const castlingRightsWeight = 300; // arbitrary
const checkmateWeight = 99999;
const pieceSquareTableWeight = 3;

/////////////////////////////////
//     default ai settings     //
/////////////////////////////////

const defaultDepth = 3;
const defaultPseudoLegalEvaluation = false;
const defaultSearchAlgorithm = "negaScout";
const defaultVisualizeSearch = false;

//////////////////////////////////
//     unsupported settings     //
//////////////////////////////////

const defaultQuiesceDepth = 4;
const defaultUseQuiesceSearch = false;
const defaultUseIterativeDeepening = false;
const defaultSearchTimeout = 3000;

//////////////////////////////////
//     move ordering tables     //
//////////////////////////////////

const MVV_LVA: number[][] = [
  [0, 0, 0, 0, 0, 0, 0], // victim K, attacker K, Q, R, B, N, P, None
  [10, 11, 12, 13, 14, 15, 0], // victim P, attacker K, Q, R, B, N, P, None
  [20, 21, 22, 23, 24, 25, 0], // victim N, attacker K, Q, R, B, N, P, None
  [30, 31, 32, 33, 34, 35, 0], // victim B, attacker K, Q, R, B, N, P, None
  [40, 41, 42, 43, 44, 45, 0], // victim R, attacker K, Q, R, B, N, P, None
  [50, 51, 52, 53, 54, 55, 0], // victim Q, attacker K, Q, R, B, N, P, None
  [0, 0, 0, 0, 0, 0, 0], // victim None, attacker K, Q, R, B, N, P, None
];

/**
 * knight, bishop, rook, queen
 */
const promotionValues: number[] = [100, 300, 500, 900];

//////////////////////////
//     phase values     //
//////////////////////////

const pawnPhase = 0;
const knightPhase = 1;
const bishopPhase = 1;
const rookPhase = 2;
const queenPhase = 4;
const totalPhase =
  pawnPhase * 16 +
  knightPhase * 4 +
  bishopPhase * 4 +
  rookPhase * 4 +
  queenPhase * 2;

/////////////////////////////////
//     piece square tables     //
/////////////////////////////////

/**
 * adapted from stockfish
 * https://github.com/official-stockfish/Stockfish/blob/master/src/psqt.cpp
 */
const blackPST: number[][][][] = [
  [],
  [
    // pawn
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [2, -8],
      [4, -6],
      [11, 9],
      [18, 5],
      [16, 16],
      [21, 6],
      [9, -6],
      [-3, -18],
    ],
    [
      [-9, -9],
      [-15, -7],
      [11, -10],
      [15, 5],
      [31, 2],
      [23, 3],
      [6, -8],
      [-20, -5],
    ],
    [
      [-3, 7],
      [-20, 1],
      [8, -8],
      [19, -2],
      [39, -14],
      [17, -13],
      [2, -11],
      [-5, -6],
    ],
    [
      [11, 12],
      [-4, 6],
      [-11, 2],
      [2, -6],
      [11, -5],
      [0, -4],
      [-12, 14],
      [5, 9],
    ],
    [
      [3, 27],
      [-11, 18],
      [-6, 19],
      [22, 29],
      [-8, 30],
      [-5, 9],
      [-14, 8],
      [-11, 14],
    ],
    [
      [-7, -1],
      [6, -14],
      [-2, 13],
      [-11, 22],
      [4, 24],
      [-14, 17],
      [10, 7],
      [-9, 7],
    ],
  ],
  [
    [
      [-175, -96],
      [-92, -65],
      [-74, -49],
      [-73, -21],
      [-73, -21],
      [-74, -49],
      [-92, -65],
      [-175, -96],
    ],
    [
      [-77, -67],
      [-41, -54],
      [-27, -18],
      [-15, 8],
      [-15, 8],
      [-27, -18],
      [-41, -54],
      [-77, -67],
    ],
    [
      [-61, -40],
      [-17, -27],
      [6, -8],
      [12, 29],
      [12, 29],
      [6, -8],
      [-17, -27],
      [-61, -40],
    ],
    [
      [-35, -35],
      [8, -2],
      [40, 13],
      [49, 28],
      [49, 28],
      [40, 13],
      [8, -2],
      [-35, -35],
    ],
    [
      [-34, -45],
      [13, -16],
      [44, 9],
      [51, 39],
      [51, 39],
      [44, 9],
      [13, -16],
      [-34, -45],
    ],
    [
      [-9, -51],
      [22, -44],
      [58, -16],
      [53, 17],
      [53, 17],
      [58, -16],
      [22, -44],
      [-9, -51],
    ],
    [
      [-67, -69],
      [-27, -50],
      [4, -51],
      [37, 12],
      [37, 12],
      [4, -51],
      [-27, -50],
      [-67, -69],
    ],
    [
      [-201, -100],
      [-83, -88],
      [-56, -56],
      [-26, -17],
      [-26, -17],
      [-56, -56],
      [-83, -88],
      [-201, -100],
    ],
  ],
  [
    [
      [-37, -40],
      [-4, -21],
      [-6, -26],
      [-16, -8],
      [-16, -8],
      [-6, -26],
      [-4, -21],
      [-37, -40],
    ],
    [
      [-11, -26],
      [6, -9],
      [13, -12],
      [3, 1],
      [3, 1],
      [13, -12],
      [6, -9],
      [-11, -26],
    ],
    [
      [-5, -11],
      [15, -1],
      [-4, -1],
      [12, 7],
      [12, 7],
      [-4, -1],
      [15, -1],
      [-5, -11],
    ],
    [
      [-4, -14],
      [8, -4],
      [18, 0],
      [27, 12],
      [27, 12],
      [18, 0],
      [8, -4],
      [-4, -14],
    ],
    [
      [-8, -12],
      [20, -1],
      [15, -10],
      [22, 11],
      [22, 11],
      [15, -10],
      [20, -1],
      [-8, -12],
    ],
    [
      [-11, -21],
      [4, 4],
      [1, 3],
      [8, 4],
      [8, 4],
      [1, 3],
      [4, 4],
      [-11, -21],
    ],
    [
      [-12, -22],
      [-10, -14],
      [4, -1],
      [0, 1],
      [0, 1],
      [4, -1],
      [-10, -14],
      [-12, -22],
    ],
    [
      [-34, -32],
      [1, -29],
      [-10, -26],
      [-16, -17],
      [-16, -17],
      [-10, -26],
      [1, -29],
      [-34, -32],
    ],
  ],
  [
    [
      [-31, -9],
      [-20, -13],
      [-14, -10],
      [-5, -9],
      [-5, -9],
      [-14, -10],
      [-20, -13],
      [-31, -9],
    ],
    [
      [-21, -12],
      [-13, -9],
      [-8, -1],
      [6, -2],
      [6, -2],
      [-8, -1],
      [-13, -9],
      [-21, -12],
    ],
    [
      [-25, 6],
      [-11, -8],
      [-1, -2],
      [3, -6],
      [3, -6],
      [-1, -2],
      [-11, -8],
      [-25, 6],
    ],
    [
      [-13, -6],
      [-5, 1],
      [-4, -9],
      [-6, 7],
      [-6, 7],
      [-4, -9],
      [-5, 1],
      [-13, -6],
    ],
    [
      [-27, -5],
      [-15, 8],
      [-4, 7],
      [3, -6],
      [3, -6],
      [-4, 7],
      [-15, 8],
      [-27, -5],
    ],
    [
      [-22, 6],
      [-2, 1],
      [6, -7],
      [12, 10],
      [12, 10],
      [6, -7],
      [-2, 1],
      [-22, 6],
    ],
    [
      [-2, 4],
      [12, 5],
      [16, 20],
      [18, -5],
      [18, -5],
      [16, 20],
      [12, 5],
      [-2, 4],
    ],
    [
      [-17, 18],
      [-19, 0],
      [-1, 19],
      [9, 13],
      [9, 13],
      [-1, 19],
      [-19, 0],
      [-17, 18],
    ],
  ],
  [
    [
      [3, -69],
      [-5, -57],
      [-5, -47],
      [4, -26],
      [4, -26],
      [-5, -47],
      [-5, -57],
      [3, -69],
    ],
    [
      [-3, -54],
      [5, -31],
      [8, -22],
      [12, -4],
      [12, -4],
      [8, -22],
      [5, -31],
      [-3, -54],
    ],
    [
      [-3, -39],
      [6, -18],
      [13, -9],
      [7, 3],
      [7, 3],
      [13, -9],
      [6, -18],
      [-3, -39],
    ],
    [
      [4, -23],
      [5, -3],
      [9, 13],
      [8, 24],
      [8, 24],
      [9, 13],
      [5, -3],
      [4, -23],
    ],
    [
      [0, -29],
      [14, -6],
      [12, 9],
      [5, 21],
      [5, 21],
      [12, 9],
      [14, -6],
      [0, -29],
    ],
    [
      [-4, -38],
      [10, -18],
      [6, -11],
      [8, 1],
      [8, 1],
      [6, -11],
      [10, -18],
      [-4, -38],
    ],
    [
      [-5, -50],
      [6, -27],
      [10, -24],
      [8, -8],
      [8, -8],
      [10, -24],
      [6, -27],
      [-5, -50],
    ],
    [
      [-2, -74],
      [-2, -52],
      [1, -43],
      [-2, -34],
      [-2, -34],
      [1, -43],
      [-2, -52],
      [-2, -74],
    ],
  ],
  [
    [
      [271, 1],
      [327, 45],
      [271, 85],
      [198, 76],
      [198, 76],
      [271, 85],
      [327, 45],
      [271, 1],
    ],
    [
      [278, 53],
      [303, 100],
      [234, 133],
      [179, 135],
      [179, 135],
      [234, 133],
      [303, 100],
      [278, 53],
    ],
    [
      [195, 88],
      [258, 130],
      [169, 169],
      [120, 175],
      [120, 175],
      [169, 169],
      [258, 130],
      [195, 88],
    ],
    [
      [164, 103],
      [190, 156],
      [138, 172],
      [98, 172],
      [98, 172],
      [138, 172],
      [190, 156],
      [164, 103],
    ],
    [
      [154, 96],
      [179, 166],
      [105, 199],
      [70, 199],
      [70, 199],
      [105, 199],
      [179, 166],
      [154, 96],
    ],
    [
      [123, 92],
      [145, 172],
      [81, 184],
      [31, 191],
      [31, 191],
      [81, 184],
      [145, 172],
      [123, 92],
    ],
    [
      [88, 47],
      [120, 121],
      [65, 116],
      [33, 131],
      [33, 131],
      [65, 116],
      [120, 121],
      [88, 47],
    ],
    [
      [59, 11],
      [89, 59],
      [45, 73],
      [-1, 78],
      [-1, 78],
      [45, 73],
      [89, 59],
      [59, 11],
    ],
  ],
];

/**
 * adapted from stockfish
 * https://github.com/official-stockfish/Stockfish/blob/master/src/psqt.cpp
 */
const whitePST: number[][][][] = [
  [],
  [
    [
      [-9, 7],
      [10, 7],
      [-14, 17],
      [4, 24],
      [-11, 22],
      [-2, 13],
      [6, -14],
      [-7, -1],
    ],
    [
      [-11, 14],
      [-14, 8],
      [-5, 9],
      [-8, 30],
      [22, 29],
      [-6, 19],
      [-11, 18],
      [3, 27],
    ],
    [
      [5, 9],
      [-12, 14],
      [0, -4],
      [11, -5],
      [2, -6],
      [-11, 2],
      [-4, 6],
      [11, 12],
    ],
    [
      [-5, -6],
      [2, -11],
      [17, -13],
      [39, -14],
      [19, -2],
      [8, -8],
      [-20, 1],
      [-3, 7],
    ],
    [
      [-20, -5],
      [6, -8],
      [23, 3],
      [31, 2],
      [15, 5],
      [11, -10],
      [-15, -7],
      [-9, -9],
    ],
    [
      [-3, -18],
      [9, -6],
      [21, 6],
      [16, 16],
      [18, 5],
      [11, 9],
      [4, -6],
      [2, -8],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
  ],
  [
    [
      [-201, -100],
      [-83, -88],
      [-56, -56],
      [-26, -17],
      [-26, -17],
      [-56, -56],
      [-83, -88],
      [-201, -100],
    ],
    [
      [-67, -69],
      [-27, -50],
      [4, -51],
      [37, 12],
      [37, 12],
      [4, -51],
      [-27, -50],
      [-67, -69],
    ],
    [
      [-9, -51],
      [22, -44],
      [58, -16],
      [53, 17],
      [53, 17],
      [58, -16],
      [22, -44],
      [-9, -51],
    ],
    [
      [-34, -45],
      [13, -16],
      [44, 9],
      [51, 39],
      [51, 39],
      [44, 9],
      [13, -16],
      [-34, -45],
    ],
    [
      [-35, -35],
      [8, -2],
      [40, 13],
      [49, 28],
      [49, 28],
      [40, 13],
      [8, -2],
      [-35, -35],
    ],
    [
      [-61, -40],
      [-17, -27],
      [6, -8],
      [12, 29],
      [12, 29],
      [6, -8],
      [-17, -27],
      [-61, -40],
    ],
    [
      [-77, -67],
      [-41, -54],
      [-27, -18],
      [-15, 8],
      [-15, 8],
      [-27, -18],
      [-41, -54],
      [-77, -67],
    ],
    [
      [-175, -96],
      [-92, -65],
      [-74, -49],
      [-73, -21],
      [-73, -21],
      [-74, -49],
      [-92, -65],
      [-175, -96],
    ],
  ],
  [
    [
      [-34, -32],
      [1, -29],
      [-10, -26],
      [-16, -17],
      [-16, -17],
      [-10, -26],
      [1, -29],
      [-34, -32],
    ],
    [
      [-12, -22],
      [-10, -14],
      [4, -1],
      [0, 1],
      [0, 1],
      [4, -1],
      [-10, -14],
      [-12, -22],
    ],
    [
      [-11, -21],
      [4, 4],
      [1, 3],
      [8, 4],
      [8, 4],
      [1, 3],
      [4, 4],
      [-11, -21],
    ],
    [
      [-8, -12],
      [20, -1],
      [15, -10],
      [22, 11],
      [22, 11],
      [15, -10],
      [20, -1],
      [-8, -12],
    ],
    [
      [-4, -14],
      [8, -4],
      [18, 0],
      [27, 12],
      [27, 12],
      [18, 0],
      [8, -4],
      [-4, -14],
    ],
    [
      [-5, -11],
      [15, -1],
      [-4, -1],
      [12, 7],
      [12, 7],
      [-4, -1],
      [15, -1],
      [-5, -11],
    ],
    [
      [-11, -26],
      [6, -9],
      [13, -12],
      [3, 1],
      [3, 1],
      [13, -12],
      [6, -9],
      [-11, -26],
    ],
    [
      [-37, -40],
      [-4, -21],
      [-6, -26],
      [-16, -8],
      [-16, -8],
      [-6, -26],
      [-4, -21],
      [-37, -40],
    ],
  ],
  [
    [
      [-17, 18],
      [-19, 0],
      [-1, 19],
      [9, 13],
      [9, 13],
      [-1, 19],
      [-19, 0],
      [-17, 18],
    ],
    [
      [-2, 4],
      [12, 5],
      [16, 20],
      [18, -5],
      [18, -5],
      [16, 20],
      [12, 5],
      [-2, 4],
    ],
    [
      [-22, 6],
      [-2, 1],
      [6, -7],
      [12, 10],
      [12, 10],
      [6, -7],
      [-2, 1],
      [-22, 6],
    ],
    [
      [-27, -5],
      [-15, 8],
      [-4, 7],
      [3, -6],
      [3, -6],
      [-4, 7],
      [-15, 8],
      [-27, -5],
    ],
    [
      [-13, -6],
      [-5, 1],
      [-4, -9],
      [-6, 7],
      [-6, 7],
      [-4, -9],
      [-5, 1],
      [-13, -6],
    ],
    [
      [-25, 6],
      [-11, -8],
      [-1, -2],
      [3, -6],
      [3, -6],
      [-1, -2],
      [-11, -8],
      [-25, 6],
    ],
    [
      [-21, -12],
      [-13, -9],
      [-8, -1],
      [6, -2],
      [6, -2],
      [-8, -1],
      [-13, -9],
      [-21, -12],
    ],
    [
      [-31, -9],
      [-20, -13],
      [-14, -10],
      [-5, -9],
      [-5, -9],
      [-14, -10],
      [-20, -13],
      [-31, -9],
    ],
  ],
  [
    [
      [-2, -74],
      [-2, -52],
      [1, -43],
      [-2, -34],
      [-2, -34],
      [1, -43],
      [-2, -52],
      [-2, -74],
    ],
    [
      [-5, -50],
      [6, -27],
      [10, -24],
      [8, -8],
      [8, -8],
      [10, -24],
      [6, -27],
      [-5, -50],
    ],
    [
      [-4, -38],
      [10, -18],
      [6, -11],
      [8, 1],
      [8, 1],
      [6, -11],
      [10, -18],
      [-4, -38],
    ],
    [
      [0, -29],
      [14, -6],
      [12, 9],
      [5, 21],
      [5, 21],
      [12, 9],
      [14, -6],
      [0, -29],
    ],
    [
      [4, -23],
      [5, -3],
      [9, 13],
      [8, 24],
      [8, 24],
      [9, 13],
      [5, -3],
      [4, -23],
    ],
    [
      [-3, -39],
      [6, -18],
      [13, -9],
      [7, 3],
      [7, 3],
      [13, -9],
      [6, -18],
      [-3, -39],
    ],
    [
      [-3, -54],
      [5, -31],
      [8, -22],
      [12, -4],
      [12, -4],
      [8, -22],
      [5, -31],
      [-3, -54],
    ],
    [
      [3, -69],
      [-5, -57],
      [-5, -47],
      [4, -26],
      [4, -26],
      [-5, -47],
      [-5, -57],
      [3, -69],
    ],
  ],
  [
    [
      [59, 11],
      [89, 59],
      [45, 73],
      [-1, 78],
      [-1, 78],
      [45, 73],
      [89, 59],
      [59, 11],
    ],
    [
      [88, 47],
      [120, 121],
      [65, 116],
      [33, 131],
      [33, 131],
      [65, 116],
      [120, 121],
      [88, 47],
    ],
    [
      [123, 92],
      [145, 172],
      [81, 184],
      [31, 191],
      [31, 191],
      [81, 184],
      [145, 172],
      [123, 92],
    ],
    [
      [154, 96],
      [179, 166],
      [105, 199],
      [70, 199],
      [70, 199],
      [105, 199],
      [179, 166],
      [154, 96],
    ],
    [
      [164, 103],
      [190, 156],
      [138, 172],
      [98, 172],
      [98, 172],
      [138, 172],
      [190, 156],
      [164, 103],
    ],
    [
      [195, 88],
      [258, 130],
      [169, 169],
      [120, 175],
      [120, 175],
      [169, 169],
      [258, 130],
      [195, 88],
    ],
    [
      [278, 53],
      [303, 100],
      [234, 133],
      [179, 135],
      [179, 135],
      [234, 133],
      [303, 100],
      [278, 53],
    ],
    [
      [271, 1],
      [327, 45],
      [271, 85],
      [198, 76],
      [198, 76],
      [271, 85],
      [327, 45],
      [271, 1],
    ],
  ],
];

/**
 * first index is mg, second is eg
 */
const pieceValues: number[][] = [
  [0, 126, 781, 825, 1276, 2538, 0, 0],
  [0, 208, 854, 915, 1380, 2682, 0, 0],
];

const mobilityBonus: number[][][] = [
  [], // empty
  [],
  [
    // knight
    [-62, -81],
    [-53, -56],
    [-12, -31],
    [-4, -16],
    [3, 5],
    [13, 11],
    [22, 17],
    [28, 20],
    [33, 25],
  ],
  [
    // bishop
    [-48, -59],
    [-20, -23],
    [16, -3],
    [26, 13],
    [38, 24],
    [51, 42],
    [55, 54],
    [63, 57],
    [63, 65],
    [68, 73],
    [81, 78],
    [81, 86],
    [91, 88],
    [98, 97],
  ],
  [
    // rook
    [-60, -78],
    [-20, -17],
    [2, 23],
    [3, 39],
    [3, 70],
    [11, 99],
    [22, 103],
    [31, 121],
    [40, 134],
    [40, 139],
    [41, 158],
    [48, 164],
    [57, 168],
    [57, 169],
    [62, 172],
  ],
  [
    // queen
    [-30, -48],
    [-12, -30],
    [-8, -7],
    [-9, 19],
    [20, 40],
    [23, 55],
    [23, 59],
    [35, 75],
    [38, 78],
    [53, 96],
    [64, 96],
    [65, 100],
    [65, 121],
    [66, 127],
    [67, 131],
    [67, 133],
    [72, 136],
    [72, 141],
    [77, 147],
    [79, 150],
    [93, 151],
    [108, 168],
    [108, 168],
    [108, 171],
    [110, 182],
    [114, 182],
    [114, 192],
    [116, 219],
  ],
  [],
];

export class ChessterAI {
  game: ChessterGame;
  team: number;

  //////////////////////////////////
  //     transposition tables     //
  //////////////////////////////////

  relativeTable: Map<bigint, number> = new Map();
  absoluteTable: Map<bigint, number> = new Map();

  //////////////////////
  //     settings     //
  //////////////////////

  depth: number;
  pseudoLegalEvaluation: boolean;
  searchAlgorithm: "negaScout" | "miniMax" | "negaMax";
  visualizeSearch: boolean;

  /////////////////////
  //     weights     //
  /////////////////////

  castlingRightsWeight: number;

  constructor(
    game: ChessterGame,
    options?: {
      depth?: number;
      pseudoLegalEvaluation?: boolean;
      searchAlgorithm?: "negaScout" | "miniMax" | "negaMax";
      visualizeSearch?: boolean;
    },
    weights?: {
      castlingRightsWeight?: number;
    }
  ) {
    this.game = game;
    this.team = BLACK; // default to black

    ////////////////////////////////////
    //     initialize ai settings     //
    ////////////////////////////////////

    this.depth = options?.depth ?? defaultDepth;
    this.pseudoLegalEvaluation =
      options?.pseudoLegalEvaluation ?? defaultPseudoLegalEvaluation;
    this.searchAlgorithm = options?.searchAlgorithm ?? defaultSearchAlgorithm;
    this.visualizeSearch = options?.visualizeSearch ?? defaultVisualizeSearch;

    ////////////////////////////////
    //     initialize weights     //
    ////////////////////////////////

    this.castlingRightsWeight =
      weights?.castlingRightsWeight ?? castlingRightsWeight;
  }

  /**
   * Returns the value of a move
   * @param move
   * @returns value
   */
  getMoveValue(move: number): number {
    let victim = 0;

    switch ((move >>> 4) & 0b1111) {
      case moveTypes.CAPTURE:
        victim = this.game.board[(move >>> 8) & 0b111111];
        break;
      case moveTypes.EN_PASSANT_WHITE:
        victim = this.game.board[((move >>> 8) & 0b111111) + 8];
        break;
      case moveTypes.EN_PASSANT_BLACK:
        victim = this.game.board[((move >>> 8) & 0b111111) - 8];
        break;
      case moveTypes.PROMOTION_QUEEN_CAPTURE:
        victim = this.game.board[(move >>> 8) & 0b111111];
        break;
      case moveTypes.PROMOTION_ROOK_CAPTURE:
        victim = this.game.board[(move >>> 8) & 0b111111];
        break;
      case moveTypes.PROMOTION_BISHOP_CAPTURE:
        victim = this.game.board[(move >>> 8) & 0b111111];
        break;
      case moveTypes.PROMOTION_KNIGHT_CAPTURE:
        victim = this.game.board[(move >>> 8) & 0b111111];
        break;
      case moveTypes.PROMOTION_QUEEN:
      case moveTypes.PROMOTION_ROOK:
      case moveTypes.PROMOTION_BISHOP:
      case moveTypes.PROMOTION_KNIGHT:
        return promotionValues[(move >>> 4) & 0b11];
    }

    return MVV_LVA[(victim >>> 1) & 0b111][(move >>> 1) & 0b111];
  }

  /**
   * Compares two moves using their values
   * @param move1
   * @param move2
   * @returns
   */
  compareMoves(move1: number, move2: number): number {
    return this.getMoveValue(move2) - this.getMoveValue(move1);
  }

  /**
   * Returns a list of available moves sorted by their values
   * @returns moves
   */
  getMoves(): number[] {
    if (this.game.isGameOver()) return [];

    let moves = [];

    for (let i = 0; i < boardSize; i++) {
      if (!this.game.board[i] || (this.game.board[i] & 0b1) !== this.game.turn)
        continue;

      const pieceMoves = this.game.getAvailableMoves(i);

      for (let j = 0; j < pieceMoves.length; j++) {
        moves.push(pieceMoves[j]);
        let k = moves.length - 1;
        while (k > 0 && this.compareMoves(moves[k - 1], moves[k]) > 0) {
          [moves[k - 1], moves[k]] = [moves[k], moves[k - 1]]; // swap
          k--;
        }
      }
    }

    return moves;
  }

  /**
   * Calculates the score of the current state relative to the AI's team
   * @returns score
   */
  calculateAbsolute(depth): number {
    if (this.game.wcm)
      return (
        (this.game.turn === this.team ? -1 : 1) * (checkmateWeight + depth)
      ); // reward sooner checkmates
    if (this.game.bcm)
      return (
        (this.game.turn === this.team ? -1 : 1) * (checkmateWeight + depth)
      ); // reward sooner checkmates
    if (this.game.stalemate || this.game.draw) return 0;

    // check transposition table
    if (this.absoluteTable.has(this.game.zobrist))
      return this.absoluteTable.get(this.game.zobrist);

    let score = 0;

    for (let i = 0; i < boardSize; i++) {
      if (this.game.board[i]) {
        score +=
          ((this.game.board[i] & 0b1) === this.team
            ? teamPieceValueWeight
            : -enemyPieceValueWeight) *
            pieceValues[0][(this.game.board[i] >>> 1) & 0b111] + // default to mg values
          mobilityWeight *
            ((this.game.board[i] & 0b1) === this.team ? 1 : -1) *
            this.game.getAvailableMoves(i).length;
      }
    }

    score +=
      castlingRightsWeight *
      (this.team === WHITE
        ? (this.game.wckc ? 1 : 0) + (this.game.wcqc ? 1 : 0)
        : (this.game.bckc ? 1 : 0) + (this.game.bcqc ? 1 : 0));

    this.absoluteTable.set(this.game.zobrist, score);

    return score;
  }

  /**
   * Calculates the score of the current state relative to the turn's team
   * @returns score
   */
  calculateRelative(depth: number): number {
    if (this.game.wcm)
      return (this.game.turn === WHITE ? -1 : 1) * (checkmateWeight + depth); // reward sooner checkmates
    if (this.game.bcm)
      return (this.game.turn === BLACK ? -1 : 1) * (checkmateWeight + depth); // reward sooner checkmates
    if (this.game.stalemate || this.game.draw) return 0;

    // check transposition table
    if (this.relativeTable.has(this.game.zobrist))
      return this.relativeTable.get(this.game.zobrist);

    let phase = totalPhase; // the higher the phase, the closer to endgame
    let scoreMG = 0;
    let scoreEG = 0;
    let score = 0;

    for (let i = 0; i < boardSize; i++) {
      if (!this.game.board[i]) continue;

      switch ((this.game.board[i] >>> 1) & 0b111) {
        case pieces.PAWN:
          phase -= pawnPhase;
          break;
        case pieces.KNIGHT:
          phase -= knightPhase;
          break;
        case pieces.BISHOP:
          phase -= bishopPhase;
          break;
        case pieces.ROOK:
          phase -= rookPhase;
          break;
        case pieces.QUEEN:
          phase -= queenPhase;
          break;
      }

      let mobilityBonusValue =
        mobilityBonus[(this.game.board[i] >>> 1) & 0b111][
          this.game.getAvailableMoves(this.game.board[i]).length
        ];

      scoreMG +=
        ((this.game.board[i] & 0b1) === this.game.turn ? 1 : -1) *
        (pieceValues[0][(this.game.board[i] >>> 1) & 0b111] +
          (mobilityBonusValue ? mobilityBonusValue[0] : 0) +
          (this.game.board[i] & 0b1 ? blackPST : whitePST)[
            (this.game.board[i] >>> 1) & 0b111
          ][(i >>> 3) & 0b111][i & 0b111][0] +
          getPawnStructureMG(this.game, i));

      scoreEG +=
        ((this.game.board[i] & 0b1) === this.game.turn ? 1 : -1) *
        (pieceValues[1][(this.game.board[i] >>> 1) & 0b111] +
          (mobilityBonusValue ? mobilityBonusValue[1] : 0) +
          (this.game.board[i] & 0b1 ? blackPST : whitePST)[
            (this.game.board[i] >>> 1) & 0b111
          ][(i >>> 3) & 0b111][i & 0b111][1]);
    }

    phase = (phase * 256 + totalPhase / 2) / totalPhase;
    phase = phase < 0 ? 0 : phase;
    score += (scoreMG * (256 - phase) + scoreEG * phase) / 256;

    this.relativeTable.set(this.game.zobrist, score);

    return score;
  }

  /**
   * negaScout algorithm
   * @param alpha
   * @param beta
   * @param depth
   * @returns score
   */
  negaScout(alpha: number, beta: number, depth: number): number {
    if (depth === 0 || this.game.isGameOver())
      return this.calculateRelative(depth);

    let b = beta;
    let bestScore = -Infinity;

    const moves = this.getMoves();

    for (let i = 0; i < moves.length; i++) {
      this.game.move(moves[i]);

      let score = -this.negaScout(-b, -alpha, depth - 1);

      if (score > alpha && score < beta && i > 1)
        score = -this.negaScout(-beta, -score, depth - 1);

      bestScore = Math.max(score, bestScore);
      alpha = Math.max(alpha, bestScore);

      this.game.undo();

      if (alpha >= beta) {
        return alpha;
      }

      b = alpha + 1;
    }

    return bestScore;
  }

  /**
   * Top level negaScout search
   * @returns [bestMove, bestScore]
   */
  negaScoutSearch(): [ChessterMove | undefined, number] {
    let bestMove: ChessterMove | undefined;
    let bestScore = -Infinity;

    let alpha = -Infinity;
    let beta = Infinity;

    const moves = this.getMoves();

    for (let i = 0; i < moves.length; i++) {
      this.game.move(moves[i]);

      let score = -this.negaScout(-beta, -alpha, this.depth - 1);

      if (score > bestScore) {
        bestScore = score;
        bestMove = moves[i];

        /**
         * NOTE: postMessage will only work in a web worker
         */

        if (this.visualizeSearch) {
          console.log(
            "visualizing move: " +
              moveToString(bestMove) +
              " with value " +
              score
          );

          postMessage({
            type: messageTypes.VISUALIZE_MOVE,
            move: bestMove,
          });
        }
      }

      alpha = Math.max(alpha, score);

      this.game.undo();
    }

    return [bestMove, bestScore];
  }

  negaMax(alpha: number, beta: number, depth: number): number {
    if (depth === 0 || this.game.isGameOver())
      return this.calculateRelative(depth);

    let bestScore = -Infinity;

    const moves = this.getMoves();

    for (let i = 0; i < moves.length; i++) {
      this.game.move(moves[i]);

      let score = -this.negaMax(-beta, -alpha, depth - 1);

      this.game.undo();

      if (score > bestScore) {
        bestScore = score;
        if (score > alpha) alpha = score;
      }

      if (score >= beta) break;
    }

    return bestScore;
  }

  negaMaxSearch(): [ChessterMove | undefined, number] {
    let alpha: number = -Infinity;
    let beta: number = Infinity;

    let bestMove: ChessterMove | undefined;
    let bestScore: number = -Infinity;

    const moves = this.getMoves();

    for (let i = 0; i < moves.length; i++) {
      this.game.move(moves[i]);

      let score = -this.negaMax(-beta, -alpha, this.depth - 1);

      this.game.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = moves[i];
        if (score > alpha) alpha = score;

        if (this.visualizeSearch) {
          console.log(
            "visualizing move: " +
              moveToString(bestMove) +
              " with value " +
              score
          );

          postMessage({
            type: messageTypes.VISUALIZE_MOVE,
            move: bestMove,
          });
        }
      }

      if (score >= beta) break;
    }

    return [bestMove, bestScore];
  }

  /**
   * minimax algorithm
   * @param depth
   * @param alpha
   * @param beta
   * @param playerType
   * @returns [bestMove, bestScore]
   */
  miniMax(
    depth: number = this.depth,
    alpha: number = -Infinity,
    beta: number = Infinity,
    playerType: number = MAX_PLAYER
  ): [ChessterMove | undefined, number] {
    if (depth === 0 || this.game.isGameOver())
      return [undefined, this.calculateAbsolute(depth)];

    if (playerType === MAX_PLAYER) {
      let bestValue = -Infinity;
      let bestMove: ChessterMove | undefined;

      const moves = this.getMoves();

      for (let j = 0; j < moves.length; j++) {
        this.game.move(moves[j]);

        const [_, value] = this.miniMax(depth - 1, alpha, beta, 1 ^ playerType);

        this.game.undo();

        if (value > bestValue) {
          bestValue = value;
          bestMove = moves[j];
        }

        if (bestValue > alpha) alpha = bestValue;
        if (alpha >= beta) break;
      }

      return [bestMove, bestValue];
    } else if (playerType === MIN_PLAYER) {
      let bestValue = Infinity;
      let bestMove: ChessterMove | undefined;

      const moves = this.getMoves();

      for (let j = 0; j < moves.length; j++) {
        this.game.move(moves[j]);

        const [_, value] = this.miniMax(depth - 1, alpha, beta, 1 ^ playerType);

        this.game.undo();

        // assume minimizer (opponent) plays optimally
        if (value < bestValue) {
          bestValue = value;
          bestMove = moves[j];
        }

        if (bestValue < beta) beta = bestValue;
        if (alpha >= beta) break;
      }

      return [bestMove, bestValue];
    }
  }

  /**
   * Searches for the best move
   * @returns bestMove
   */
  getMove(): ChessterMove | undefined {
    const startTime = performance.now();

    this.team = this.game.turn;

    const [move, value] = (() => {
      switch (this.searchAlgorithm) {
        case "negaScout":
          return this.negaScoutSearch();
        case "negaMax":
          return this.negaMaxSearch();
        case "miniMax":
          return this.miniMax();
        default:
          throw new Error("invalid search algorithm");
      }
    })();

    /**
     * NOTE: console.log left intentionally
     */

    console.log(
      "algorithm: " +
        this.searchAlgorithm +
        ". depth: " +
        this.depth +
        ". time taken: " +
        (performance.now() - startTime) +
        "ms. value: " +
        value
    );

    return move;
  }

  /**
   * Searches and makes the best move
   * @returns move
   */
  makeMove(): ChessterMove | undefined {
    const move = this.getMove();
    if (move !== undefined) this.game.move(move);
    return move;
  }
}
