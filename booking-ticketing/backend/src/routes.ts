import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest, authMiddleware } from "./middleware";
import { ok, created, fail } from "./utils";
import {
  authService,
  userService,
  ticketTypeService,
  orderService,
  paymentService,
  ticketService,
  tripHistoryService,
} from "./services";

const router = Router();

// Hàm bọc (wrap) để bắt lỗi bất đồng bộ (Async Error)
const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// ================= AUTHENTICATION =================
router.post(
  "/auth/register",
  wrap(async (req: Request, res: Response) => {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password)
      return fail(res, 400, "fullName, email, password required", "INVALID_INPUT");
      
    const result = await authService.register({ fullName, email, password, phone });
    return created(res, result, "Register successfully");
  })
);

router.post(
  "/auth/login",
  wrap(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return ok(res, result, "Login successfully");
  })
);

// ================= USER PROFILE =================
router.get(
  "/users/me",
  authMiddleware,
  wrap(async (req: AuthRequest, res: Response) => {
    const u = await userService.getById(req.user!.userId);
    if (!u) return fail(res, 404, "User not found", "USER_NOT_FOUND");
    return ok(res, u);
  })
);

router.put(
  "/users/me",
  authMiddleware,
  wrap(async (req: AuthRequest, res: Response) => {
    const u = await userService.update(req.user!.userId, req.body);
    if (!u) return fail(res, 404, "User not found", "USER_NOT_FOUND");
    return ok(res, u, "Updated");
  })
);

// ================= TICKET TYPES =================
router.get(
  "/ticket-types",
  wrap(async (_req: Request, res: Response) => {
    const list = await ticketTypeService.list();
    return ok(res, list);
  })
);

// ================= ORDERS =================
router.post(
  "/orders",
  authMiddleware,
  wrap(async (req: AuthRequest, res: Response) => {
    const result = await orderService.create(req.user!.userId, req.body.items || []);
    return created(res, result, "Order created");
  })
);

router.get(
  "/orders/me",
  authMiddleware,
  wrap(async (req: AuthRequest, res: Response) => {
    const list = await orderService.listByUser(req.user!.userId);
    return ok(res, list);
  })
);

router.get(
  "/orders/:id",
  authMiddleware,
  wrap(async (req: AuthRequest, res: Response) => {
    const detail = await orderService.detail(Number(req.params.id), req.user!.userId);
    return ok(res, detail);
  })
);

// ================= PAYMENTS =================
router.post(
  "/payments",
  authMiddleware,
  wrap(async (req: AuthRequest, res: Response) => {
    const { orderId, method } = req.body;
    const result = await paymentService.pay(
      req.user!.userId,
      Number(orderId),
      method || "MOCK"
    );
    return ok(res, result, "Payment success");
  })
);

// ================= TICKETS =================
router.get(
  "/tickets/me",
  authMiddleware,
  wrap(async (req: AuthRequest, res: Response) => {
    const list = await ticketService.listByUser(req.user!.userId);
    return ok(res, list);
  })
);

router.get(
  "/tickets/:id",
  authMiddleware,
  wrap(async (req: AuthRequest, res: Response) => {
    const detail = await ticketService.detail(Number(req.params.id), req.user!.userId);
    return ok(res, detail);
  })
);

// ================= TRIP HISTORIES =================
router.post(
  "/trip-histories",
  authMiddleware,
  wrap(async (req: AuthRequest, res: Response) => {
    const result = await tripHistoryService.create(req.user!.userId, req.body);
    return created(res, result, "Saved");
  })
);

router.get(
  "/trip-histories/me",
  authMiddleware,
  wrap(async (req: AuthRequest, res: Response) => {
    const list = await tripHistoryService.listByUser(req.user!.userId);
    return ok(res, list);
  })
);

export default router;