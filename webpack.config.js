const path = require("path");

module.exports = {
  entry: {
    bundle: "./public/index.ts",
    worker: "./public/worker.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.webpack.json",
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "./public/"),
  },
  watch: true,
  mode: "development",
};
