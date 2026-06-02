import { Router, type IRouter } from "express";
import healthRouter from "./health";
import applicationsRouter from "./applications";
import verificationRouter from "./verification";
import addressRouter from "./address";
import documentsRouter from "./documents";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/applications", applicationsRouter);
router.use("/verify", verificationRouter);
router.use("/address", addressRouter);
router.use("/documents", documentsRouter);
router.use("/admin", adminRouter);

export default router;
