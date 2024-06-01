import {EraserTool} from "../pages/main/tools/eraser-tool.ts";
import {MosaicTool} from "../pages/main/tools/mosaic-tool.ts";

export enum ToolName {
    // 矩形工具
    RECTANGLE_TOOL = "RectangleTool",

    // 椭圆工具
    ELLIPSE_TOOL = "EllipseTool",

    // 直线工具
    STRAIGHT_LINE_TOOL = "StraightLineTool",

    // 自由曲线工具
    FREE_CURVE_TOOL = "FreeCurveTool",

    // 马克笔工具
    MARKER_PEN_TOOL = "MarkerPenTool",

    // 数字工具
    NUMBER_TOOL = "NumberTool",

    // 箭头工具
    ARROW_TOOL = "ArrowTool",

    // 橡皮擦工具
    ERASER_TOOL = "EraserTool",

    // 马赛克工具
    MOSAIC_TOOL = "MosaicTool",

    UNDO_TOOL = "UndoTool",
    REDO_TOOL = "RedoTool",
    COPY_TOOL = "CopyTool",
    SAVE_TOOL = "SaveTool",
    OK_TOOL = "OkToll"
}