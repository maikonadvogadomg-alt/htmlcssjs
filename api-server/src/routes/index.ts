import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiChatRouter from "./ai-chat";
import searchRouter from "./search";
import execRouter from "./exec";
import proxyRouter from "./proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiChatRouter);
router.use(searchRouter);
router.use(execRouter);
router.use(proxyRouter);

export default router;
