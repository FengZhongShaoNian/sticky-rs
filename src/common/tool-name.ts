import {EllipseTool} from "../pages/main/tools/ellipse-tool.ts";
import {MarkerPenTool} from "../pages/main/tools/marker-pen-tool.ts";
import {NumberTool} from "../pages/main/tools/number-tool.ts";

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


    UNDO_TOOL = "UndoTool",
    REDO_TOOL = "RedoTool"
}