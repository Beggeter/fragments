export type ColorTheme = {
  background: string;
  borderStart: string;
  borderMiddle: string;
  borderEnd: string;
};

export const colorThemes: Record<string, ColorTheme> = {
  // Blue theme
  level1: {
    background: "#1F5EFF",
    borderStart: "rgba(41, 104, 234, 0.3)",
    borderMiddle: "#3A73F0",
    borderEnd: "#6098FF",
  },
  level2: {
    background: "#336BFF", // светло-синий
    borderStart: "rgba(82, 139, 255, 0.3)",
    borderMiddle: "#528BFF",
    borderEnd: "#88AFFF",
  },
  level3: {
    background: "#007D99", // переход от синего к бирюзовому
    borderStart: "rgba(136, 255, 245, 0.3)",
    borderMiddle: "#88FFF5",
    borderEnd: "#52EAD5",
  },
  level4: {
    background: "#66D800", // яркий зелёный
    borderStart: "rgba(160, 255, 123, 0.3)",
    borderMiddle: "#A0FF7B",
    borderEnd: "#C8FFAA",
  },
  level5: {
    background: "#008C00", // более тёмный зелёный
    borderStart: "rgba(82, 255, 105, 0.3)",
    borderMiddle: "#52FF69",
    borderEnd: "#88FF9E",
  },
  level6: {
    background: "#A7E600", // яркий лайм
    borderStart: "rgba(205, 255, 82, 0.3)",
    borderMiddle: "#CDFF52",
    borderEnd: "#E0FF88",
  },

  // Yellow theme
  level7: {
    background: "#FFD700", // яркий жёлтый
    borderStart: "rgba(255, 235, 100, 0.3)",
    borderMiddle: "#FFEB64",
    borderEnd: "#FFF17F",
  },
  level8: {
    background: "#A48F00", // чуть темнее
    borderStart: "rgba(234, 214, 82, 0.3)",
    borderMiddle: "#EAD652",
    borderEnd: "#FDEB75",
  },
  level9: {
    background: "#8C7A00", // самый тёмный
    borderStart: "rgba(255, 239, 136, 0.3)",
    borderMiddle: "#FFEF88",
    borderEnd: "#FFEB52",
  },

  // Orange theme
  level10: {
    background: "#FF7A29", // яркий оранжевый
    borderStart: "rgba(255, 155, 82, 0.3)",
    borderMiddle: "#FF9B52",
    borderEnd: "#FFB388",
  },
  level11: {
    background: "#E05E00",
    borderStart: "rgba(234, 104, 41, 0.3)",
    borderMiddle: "#EA6829",
    borderEnd: "#FD8145",
  },
  level12: {
    background: "#B34700", // насыщенный тёмно-оранжевый
    borderStart: "rgba(255, 179, 136, 0.3)",
    borderMiddle: "#FFB388",
    borderEnd: "#FF9B52",
  },

  // Red theme
  level13: {
    background: "#FF4F4F", // светло-красный
    borderStart: "rgba(255, 105, 149, 0.3)",
    borderMiddle: "#FF5C47",
    borderEnd: "#FF847A",
  },
  level14: {
    background: "#E03030", // насыщенный красный
    borderStart: "rgba(255, 60, 45, 0.3)",
    borderMiddle: "#FF4030",
    borderEnd: "#FF6759",
  },
  level15: {
    background: "#B41A1A", // тёмный красный
    borderStart: "rgba(255, 139, 130, 0.3)",
    borderMiddle: "#FF4F4F",
    borderEnd: "#FF8C8C",
  },

  // Purple theme
  level16: {
    background: "#9C66FF", // светло-фиолетовый
    borderStart: "rgba(139, 82, 255, 0.3)",
    borderMiddle: "#8B52FF",
    borderEnd: "#B388FF",
  },
  level17: {
    background: "#8A42E6",
    borderStart: "rgba(180, 104, 255, 0.3)",
    borderMiddle: "#B068FF",
    borderEnd: "#CB88FF",
  },
  level18: {
    background: "#6C1AC0", // насыщенный фиолетовый
    borderStart: "rgba(175, 136, 255, 0.3)",
    borderMiddle: "#AF88FF",
    borderEnd: "#8B52FF",
  },

  // Pink theme
  level19: {
    background: "#FF66C2", // светло-розовый
    borderStart: "rgba(255, 82, 205, 0.3)",
    borderMiddle: "#FF52CD",
    borderEnd: "#FF88E0",
  },
  level20: {
    background: "#E042A6",
    borderStart: "rgba(234, 41, 182, 0.3)",
    borderMiddle: "#EA29B6",
    borderEnd: "#FD45C9",
  },
  level21: {
    background: "#A6197A", // тёмный розовый
    borderStart: "rgba(255, 136, 230, 0.3)",
    borderMiddle: "#FF88E6",
    borderEnd: "#FF52CD",
  },
};

