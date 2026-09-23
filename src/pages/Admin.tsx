import { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import jsPDF from "jspdf";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  ShoppingBag,
  Plus,
  Filter,
  Search,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Mail,
  Eye,
  Upload,
  X,
  Ticket,
  Gift,
  Check,
  Copy,
  FileDown,
  Layers,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { mockProducts } from "@/data/products";
import { Product, ProductVariation } from "@/features/product/productTypes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  createProduct,
  fetchProducts,
  fetchAllProductsForAdmin,
  updateProduct,
  deleteProduct,
} from "@/features/product/productActions";
import {
  createVariant,
  updateVariant,
  deleteVariant,
  fetchAllVariants,
} from "@/features/variants/variantActions";
import { deleteUser, fetchUsers } from "@/features/user/userActions";
import {
  fetchOrders,
  fetchOrderById,
  updateOrder,
} from "@/features/order/orderActions";
import { createNotification } from "@/features/notification/notificationActions";
import {
  fetchTotalRevenue,
  fetchAverageTicket,
  fetchTotalOrders,
  fetchDeliveryRate,
  fetchSalesByStatus,
  fetchTopClients,
  fetchTopProducts,
  fetchLeastSoldProducts,
  fetchSalesByPeriod,
} from "@/features/report/reportActions";
import { Order, OrderStatus } from "@/features/order/orderTypes";
import { productionUrl } from "@/lib/utils";
// Helper para converter hex em nome de cor em português
const hexToColorName = (hex?: string | null) => {
  if (!hex) return null;
  const map: Record<string, string> = {
    "#000000": "Preto",
    "#ffffff": "Branco",
    "#ff0000": "Vermelho",
    "#00ff00": "Verde",
    "#008000": "Verde",
    "#0000ff": "Azul",
    "#ffff00": "Amarelo",
    "#ff00ff": "Magenta",
    "#00ffff": "Ciano",
    "#808080": "Cinza",
    "#ffa500": "Laranja",
    "#800080": "Roxo",
    "#a52a2a": "Marrom",
    "#ff69b4": "Rosa",
  };
  const key = hex.toLowerCase().trim();
  return map[key] || null;
};
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
} from "@/features/coupon/cupomActions";
import { ICoupon } from "@/features/coupon/cupomTypes";
import { resetCouponState } from "@/features/coupon/cupomSlice";
import { getAllReviews, deleteReview } from "@/features/reviews/reviewActions";
import { IReview } from "@/features/reviews/reviewTypes";
import { Star, MessageSquare } from "lucide-react";

type ProductVariant = {
  id: string;
  color: string;
  size: string;
  quantity: number;
  image?: string;
  imageFile?: File | null;
  stock?: number;
  imagePreview?: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
};

type VariantFormState = {
  color: string;
  size: string;
  sku?: string;
  stock: number;
  imagePreview: string;
  imageFile: File | null;
};

type OrderViewShape = {
  id: string;
  customerName: string;
  date: string;
  createdAt?: string | Date;
  total: number;
  status: string;
  items: number;
  user: any;
  products: any[];
  raw?: any;
  clientConfirmed?: boolean;
};

const createEmptyVariantForm = (): VariantFormState => ({
  color: "#000000",
  size: "",
  sku: "",
  stock: 0,
  imagePreview: "",
  imageFile: null,
});

// Componente interno que contém toda a lógica
const AdminContent = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const reportRef = useRef<HTMLDivElement>(null);
  const productFormRef = useRef<HTMLFormElement>(null);
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("orders");
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [productImage, setProductImage] = useState<string>("");
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [ordersPage, setOrdersPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetailsPage, setOrderDetailsPage] = useState(1);
  const itemsPerPage = 5;
  const orderDetailsItemsPerPage = 3;
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editProductImageFile, setEditProductImageFile] = useState<File | null>(
    null
  );
  const [editProductImagePreview, setEditProductImagePreview] =
    useState<string>("");
  // Confirmation dialog state for destructive actions
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action:
      | null
      | "removeCustomer"
      | "cancelOrder"
      | "deleteProduct"
      | "deleteCoupon"
      | "deleteReview"
      | "deleteVariant";
    id?: string;
    name?: string;
    reviewId?: string;
    reviewText?: string;
    variantId?: string;
    variantSku?: string;
  }>({ open: false, action: null });
  const [isConfirming, setIsConfirming] = useState(false);

  // Estado para edição de variante
  const [editingVariant, setEditingVariant] = useState<ProductVariation | null>(
    null
  );
  const [isEditVariantMode, setIsEditVariantMode] = useState(false);
  const [variantForm, setVariantForm] = useState<VariantFormState>(() =>
    createEmptyVariantForm()
  );

  // Estado para aba de variantes
  const [variantsPage, setVariantsPage] = useState(1);
  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  const [allVariants, setAllVariants] = useState<ProductVariation[]>([]);
  const [selectedProductForVariant, setSelectedProductForVariant] =
    useState<string>("");
  const [variantProductFilter, setVariantProductFilter] =
    useState<string>("all");
  const [isProductSelectModalOpen, setIsProductSelectModalOpen] =
    useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productSelectPage, setProductSelectPage] = useState(1);
  const productSelectItemsPerPage = 10;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewSearchTerm, setReviewSearchTerm] = useState("");
  const [couponsPage, setCouponsPage] = useState(1);
  const [couponSearchTerm, setCouponSearchTerm] = useState("");
  const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null);
  const [isEditCouponDialogOpen, setIsEditCouponDialogOpen] = useState(false);
  const [isCreateCouponDialogOpen, setIsCreateCouponDialogOpen] =
    useState(false);

  //  do formulário de cupom
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount: "",
    type: "percentage" as "percentage" | "fixed",
    expiresAt: "", // Adicionar data de expiração
    minPurchaseAmount: "",
    maxDiscountAmount: "",
    usageLimit: "1", // Limite de uso padrão
    assignedTo: "", // Cliente atribuído (opcional)
  });

  const [clients, setClients] = useState<Customer[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  // TODOS os useAppSelector devem vir ANTES de qualquer useEffect
  const {
    coupons: apiCoupons,
    loading: couponLoading,
    error: couponError,
    success: couponSuccess,
  } = useAppSelector((state) => state.coupon);

  const {
    reviews,
    loading: reviewsLoading,
    error: reviewsError,
  } = useAppSelector((state) => state.review);

  const { products, loading, error } = useAppSelector((state) => state.product);
  const {
    users,
    loading: usersLoading,
    error: usersError,
    user: currentUser,
    isAuthenticated,
  } = useAppSelector((state) => state.user);

  // Verificar se o usuário é manager (deve estar logo após currentUser ser declarado)
  const isManager = currentUser?.role === "manager";
  const isAdmin = currentUser?.role === "admin";

  const {
    orders,
    currentOrder,
    loading: ordersLoading,
    error: ordersError,
  } = useAppSelector((state) => state.order as any);

  const {
    variants: variantsFromState,
    loading: variantLoading,
    error: variantError,
  } = useAppSelector((state) => state.variant);

  const {
    totalRevenue,
    averageTicket,
    totalOrders,
    deliveryRate,
    salesByStatus,
    topClients,
    topProducts,
    leastSoldProducts,
    salesByPeriod,
    loading: reportLoading,
    error: reportError,
  } = useAppSelector((state) => state.report as any);

  // Agora TODOS os useEffect vêm depois de todos os useAppSelector
  // Atualizar clients quando topClients mudar
  useEffect(() => {
    if (Array.isArray(topClients)) {
      setClients(topClients);
    }
  }, [topClients]);

  // Carregar cupons quando entrar na aba de relatórios ou cupons
  useEffect(() => {
    if (activeTab === "reports" || activeTab === "coupons") {
      dispatch(getAllCoupons());
    }
  }, [activeTab, dispatch]);

  // Carregar usuários quando entrar na aba de cupons
  useEffect(() => {
    if (activeTab === "coupons") {
      dispatch(fetchUsers());
    }
  }, [activeTab, dispatch]);

  // Carregar reviews quando entrar na aba de reviews
  useEffect(() => {
    if (activeTab === "reviews") {
      dispatch(getAllReviews(undefined));
    }
  }, [activeTab, dispatch]);

  // Carregar produtos quando entrar na aba de produtos (admin vê TODOS, incluindo fora de estoque)
  useEffect(() => {
    if (activeTab === "products") {
      dispatch(fetchAllProductsForAdmin());
    }
  }, [activeTab, dispatch]);

  // Carregar variantes quando entrar na aba de variantes
  useEffect(() => {
    if (activeTab === "variants") {
      dispatch(fetchAllVariants());
    }
  }, [activeTab, dispatch]);

  // Atualizar allVariants quando variantsFromState mudar
  useEffect(() => {
    if (variantsFromState && Array.isArray(variantsFromState)) {
      setAllVariants(variantsFromState);
    }
  }, [variantsFromState]);

  // Mostrar feedback quando cupom for criado
  useEffect(() => {
    if (couponSuccess && selectedClient) {
      toast({
        title: "Cupom criado!",
        description: `Cupom atribuído a ${selectedClient.clientName}`,
      });
      setIsDialogOpen(false);
      setCouponForm({
        code: "",
        discount: "",
        type: "percentage",
        expiresAt: "",
        minPurchaseAmount: "",
        maxDiscountAmount: "",
        usageLimit: "1",
        assignedTo: "",
      });
      setSelectedClient(null);
      // Resetar o estado de sucesso para evitar que o toast apareça novamente
      dispatch(resetCouponState());
    }
  }, [couponSuccess, selectedClient, dispatch, toast]);

  // Mostrar erro se houver
  useEffect(() => {
    if (couponError) {
      toast({
        title: "Erro ao criar cupom",
        description: couponError,
        variant: "destructive",
      });
    }
  }, [couponError, toast]);

  // Função para gerar código de cupom
  const generateCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponForm((prev) => ({ ...prev, code }));
  };

  // Função para obter data mínima (hoje)
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Pelo menos amanhã
    return today.toISOString().split("T")[0];
  };

  const handleAssignCoupon = async () => {
    if (
      !selectedClient ||
      !couponForm.code ||
      !couponForm.discount ||
      !couponForm.expiresAt
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar cupom via API
      await dispatch(
        createCoupon({
          code: couponForm.code.toUpperCase(),
          discount: parseFloat(couponForm.discount),
          type: couponForm.type,
          expiresAt: new Date(couponForm.expiresAt).toISOString(),
          assignedTo: selectedClient.clientId,
          minPurchaseAmount: couponForm.minPurchaseAmount
            ? parseFloat(couponForm.minPurchaseAmount)
            : undefined,
          maxDiscountAmount: couponForm.maxDiscountAmount
            ? parseFloat(couponForm.maxDiscountAmount)
            : undefined,
          usageLimit: parseInt(couponForm.usageLimit),
          isActive: true,
        })
      ).unwrap();

      // Recarregar lista de cupons
      await dispatch(getAllCoupons());
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error || "Não foi possível criar o cupom",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copiado!",
      description: `Código ${code} copiado para a área de transferência`,
    });
  };

  const existingVariants: ProductVariation[] =
    (editingProduct?.variants as ProductVariation[] | undefined) ||
    (editingProduct?.variations as ProductVariation[] | undefined) ||
    [];

  // useEffect para carregar produtos (admin vê TODOS, incluindo fora de estoque)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        await dispatch(fetchAllProductsForAdmin()).unwrap();
        setProductsLoaded(true);
      } catch (err) {
        console.error("❌ Admin: Erro ao carregar produtos:", err);
        setProductsLoaded(true);
      }
    };

    if (!productsLoaded) {
      loadProducts();
    }
  }, [dispatch, productsLoaded]);

  // Carregar usuários
  useEffect(() => {
    const loadUsers = async () => {
      try {
        await dispatch(fetchUsers()).unwrap();
      } catch (err) {
        console.error("❌ Admin: Erro ao carregar usuários:", err);
      }
    };

    loadUsers();
  }, [dispatch]);

  // Carregar pedidos
  useEffect(() => {
    const loadOrders = async () => {
      try {
        await dispatch(fetchOrders(undefined)).unwrap();
      } catch (err) {
        console.error("❌ Admin: Erro ao carregar pedidos:", err);
      }
    };

    loadOrders();
  }, [dispatch]);

  // Load report data when the Reports tab is opened (once) - apenas para admin
  useEffect(() => {
    if (isManager || activeTab !== "reports" || reportsLoaded) return;

    const loadReports = async () => {
      try {
        await dispatch(fetchTotalRevenue()).unwrap();
        await dispatch(fetchAverageTicket()).unwrap();
        await dispatch(fetchTotalOrders()).unwrap();
        await dispatch(fetchDeliveryRate()).unwrap();
        await dispatch(fetchSalesByStatus()).unwrap();
        await dispatch(fetchTopClients()).unwrap();
        await dispatch(fetchTopProducts()).unwrap();
        await dispatch(fetchLeastSoldProducts()).unwrap();
        await dispatch(fetchSalesByPeriod()).unwrap();
        setReportsLoaded(true);
      } catch (err) {
        // errors handled in slice; mark loaded to avoid retry loop
        setReportsLoaded(true);
      }
    };

    loadReports();
  }, [activeTab, reportsLoaded, dispatch, isManager]);

  // Todas as verificações de segurança foram movidas para o componente wrapper Admin
  // Aqui só temos a lógica do componente, sem returns condicionais

  const formatCustomerAddress = (address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  }) => {
    if (!address) return "Endereço não informado";

    const defaultValues = [
      "Informe a rua e número",
      "Informe a cidade",
      "Informe o estado",
      "Informe o código de endereçamento postal",
    ];

    // Verifica se é um endereço padrão
    if (
      defaultValues.includes(address.street) &&
      defaultValues.includes(address.city) &&
      defaultValues.includes(address.state) &&
      defaultValues.includes(address.zipCode)
    ) {
      return "Endereço não informado";
    }

    // Filtra campos válidos
    const parts = [
      !defaultValues.includes(address.street) ? address.street : null,
      !defaultValues.includes(address.city) ? address.city : null,
      !defaultValues.includes(address.state) ? address.state : null,
      !defaultValues.includes(address.zipCode) ? address.zipCode : null,
    ].filter(Boolean);

    return parts.length > 0
      ? `${parts.slice(0, 2).join(", ")}${parts[2] ? ` - ${parts[2]}` : ""}${
          parts[3] ? ` (${parts[3]})` : ""
        }`
      : "Endereço não informado";
  };

  const customersFromApi: Customer[] = (users || []).map((user) => {
    const joinDate = user.createdAt || new Date().toISOString();

    // Verifica se o telefone é o valor padrão
    const phone =
      user.phone && user.phone !== "(+258) XX XXXXXXX"
        ? user.phone
        : "Contacto não informado";

    return {
      id: user.userId || user._id,
      name: user.name,
      email: user.email,
      phone: phone,
      address: formatCustomerAddress(user.address),
      joinDate,
      totalOrders: user.totalOrders ?? 0,
      totalSpent: user.totalSpent ?? 0,
      lastOrder: user.lastOrder || joinDate,
    };
  });
  // Use API orders or fallback to mock
  const allOrders = orders.map((order: Order) => {
    const userObj = typeof order.user === "object" ? order.user : null;
    const userName = userObj?.name || "Cliente";
    return {
      id: order._id || order.id || "",
      customerName: userName,
      date: order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("pt-BR")
        : "",
      createdAt: order.createdAt, // Manter original para formatação no modal
      total: order.totalPrice || 0,
      status: order.status || "pendente",
      items: order.totalItems || order.products?.length || 0,
      user: userObj, // Incluir objeto user completo para acesso aos dados do cliente
      products: order.products, // Incluir produtos para o modal de detalhes
      clientConfirmed: order.clientConfirmed || false, // Incluir confirmação do cliente
      raw: order, // Manter objeto original completo
    };
  });

  // Helper to normalize an order object (from currentOrder or API) into the view shape used above
  const mapOrderToView = (o: Order | null): OrderViewShape | null => {
    if (!o) return null;
    const userObj = typeof o.user === "object" ? o.user : null;
    return {
      id: o._id || o.id || "",
      customerName: userObj?.name || "Cliente",
      date: o.createdAt
        ? new Date(o.createdAt).toLocaleDateString("pt-BR")
        : "",
      createdAt: o.createdAt, // Manter original para formatação
      total: o.totalPrice || o.finalPrice || 0,
      status: o.status || "pendente",
      items: o.totalItems || o.products?.length || 0,
      user: userObj,
      products: o.products || [],
      raw: o,
      clientConfirmed: o.clientConfirmed || false,
    };
  };

  // Filter orders
  const filteredOrders = allOrders.filter((order) => {
    const matchesFilter = orderFilter === "all" || order.status === orderFilter;
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  // Filter products
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter customers
  const filteredCustomers = customersFromApi.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.id.includes(customerSearchTerm)
  );

  // Pagination calculations
  const totalOrdersPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const totalCustomersPages = Math.ceil(
    filteredCustomers.length / itemsPerPage
  );
  const totalProductsPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedOrders = filteredOrders.slice(
    (ordersPage - 1) * itemsPerPage,
    ordersPage * itemsPerPage
  );

  const paginatedCustomers = filteredCustomers.slice(
    (customersPage - 1) * itemsPerPage,
    customersPage * itemsPerPage
  );

  const paginatedProducts = filteredProducts.slice(
    (productsPage - 1) * itemsPerPage,
    productsPage * itemsPerPage
  );

  // Sales statistics (computed fallback values)
  const computedTotalRevenue = allOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );
  const computedTotalOrders = allOrders.length;
  const computedAverageOrderValue =
    computedTotalRevenue / (computedTotalOrders || 1);
  const computedDeliveredOrders = allOrders.filter(
    (o) => o.status === "entregue"
  ).length;
  const computedDeliveryRate =
    (computedDeliveredOrders / (computedTotalOrders || 1)) * 100;

  // Prefer server-provided report values when available
  const totalOrdersValue =
    typeof totalOrders === "number" ? totalOrders : computedTotalOrders;

  // Prefer server-provided delivered orders count when available
  const deliveredOrders =
    Array.isArray(salesByStatus) && salesByStatus.length
      ? salesByStatus.find(
          (s) => s.status === "entregue" || s.status === "delivered"
        )?.count ?? computedDeliveredOrders
      : computedDeliveredOrders;

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;
      const lineHeight = 7;
      const sectionSpacing = 10;

      // Cores
      const primaryColor = [0, 0, 0]; // Preto
      const secondaryColor = [128, 128, 128]; // Cinza
      const accentColor = [59, 130, 246]; // Azul

      // Função auxiliar para adicionar nova página se necessário
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Função para adicionar texto com estilo
      const addText = (
        text: string,
        x: number,
        y: number,
        fontSize: number,
        isBold: boolean = false,
        color: number[] = primaryColor,
        align?: "left" | "center" | "right"
      ) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", isBold ? "bold" : "normal");
        pdf.setTextColor(color[0], color[1], color[2]);
        if (align) {
          pdf.text(text, x, y, { align });
        } else {
          pdf.text(text, x, y);
        }
      };

      // Função para adicionar linha horizontal
      const addLine = (y: number) => {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, y, pageWidth - margin, y);
      };

      // Cabeçalho
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, 40, "F");

      addText("DASHBOARD", margin, 25, 24, true, [255, 255, 255]);
      addText(
        "Relatório de Vendas e Análises",
        margin,
        33,
        10,
        false,
        [255, 255, 255]
      );

      const date = new Date();
      const dateStr = date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const timeStr = date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      addText(
        `Gerado em: ${dateStr} às ${timeStr}`,
        pageWidth - margin,
        33,
        9,
        false,
        [255, 255, 255],
        "right"
      );

      yPosition = 50;

      // Resumo Executivo
      addText("RESUMO EXECUTIVO", margin, yPosition, 14, true);
      yPosition += lineHeight + 2;
      addLine(yPosition);
      yPosition += sectionSpacing;

      const summaryData = [
        { label: "Receita Total", value: `${totalRevenue} MZN` },
        { label: "Ticket Médio", value: `${averageTicket} MZN` },
        { label: "Total de Pedidos", value: totalOrdersValue.toString() },
        { label: "Taxa de Entrega", value: `${deliveryRate}%` },
      ];

      const summaryColWidth = (pageWidth - 2 * margin) / 2;
      summaryData.forEach((item, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * summaryColWidth;
        const y = yPosition + row * (lineHeight + 5);

        addText(item.label, x, y, 9, false, secondaryColor);
        addText(item.value, x, y + 5, 12, true);
      });

      yPosition += 30;

      // Vendas por Status
      checkPageBreak(40);
      addText("VENDAS POR STATUS", margin, yPosition, 14, true);
      yPosition += lineHeight + 2;
      addLine(yPosition);
      yPosition += sectionSpacing;

      // Cabeçalho da tabela
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, "F");
      addText("Status", margin + 2, yPosition, 9, true);
      addText("Quantidade", margin + 60, yPosition, 9, true);
      addText("Valor Total", margin + 100, yPosition, 9, true);
      addText(
        "Percentual",
        pageWidth - margin - 25,
        yPosition,
        9,
        true,
        undefined,
        "right"
      );
      yPosition += 10;

      const statusLabels: Record<string, string> = {
        pendente: "Pendente",
        confirmado: "Confirmado",
        enviado: "Enviado",
        entregue: "Entregue",
        cancelado: "Cancelado",
      };

      const statusColors: Record<string, number[]> = {
        pendente: [128, 128, 128],
        confirmado: [0, 0, 0],
        enviado: [0, 0, 0],
        entregue: [34, 197, 94],
        cancelado: [239, 68, 68],
      };

      const statusData =
        salesByStatus && salesByStatus.length > 0
          ? salesByStatus
          : ["pendente", "confirmado", "enviado", "entregue", "cancelado"].map(
              (status) => {
                const ordersWithStatus = allOrders.filter(
                  (o) => o.status === status
                );
                const total = ordersWithStatus.reduce(
                  (sum, o) => sum + o.total,
                  0
                );
                return {
                  status,
                  count: ordersWithStatus.length,
                  total,
                };
              }
            );

      statusData.forEach((item: any) => {
        checkPageBreak(10);
        const percentage = (
          (item.count / (totalOrdersValue || 1)) *
          100
        ).toFixed(1);
        const statusLabel = statusLabels[item.status] || item.status;
        const statusColor = statusColors[item.status] || secondaryColor;

        addText(statusLabel, margin + 2, yPosition, 9, false, statusColor);
        addText(item.count.toString(), margin + 60, yPosition, 9);
        addText(`${item.total.toFixed(2)} MZN`, margin + 100, yPosition, 9);
        addText(
          `${percentage}%`,
          pageWidth - margin - 2,
          yPosition,
          9,
          false,
          undefined,
          "right"
        );
        yPosition += lineHeight + 2;
      });

      yPosition += sectionSpacing;

      // Principais Clientes
      checkPageBreak(40);
      addText("PRINCIPAIS CLIENTES", margin, yPosition, 14, true);
      yPosition += lineHeight + 2;
      addLine(yPosition);
      yPosition += sectionSpacing;

      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, "F");
      addText("Cliente", margin + 2, yPosition, 9, true);
      addText("Pedidos", margin + 100, yPosition, 9, true);
      addText("Total Gasto", margin + 130, yPosition, 9, true);
      addText(
        "Último Pedido",
        pageWidth - margin - 2,
        yPosition,
        9,
        true,
        undefined,
        "right"
      );
      yPosition += 10;

      const clientsToShow =
        topClients && topClients.length > 0
          ? topClients.slice(0, 5)
          : customersFromApi
              .sort((a, b) => b.totalSpent - a.totalSpent)
              .slice(0, 5);

      clientsToShow.forEach((client: any) => {
        checkPageBreak(10);
        const clientName = client.clientName || client.name || "N/A";
        const lastOrder = client.lastOrder
          ? new Date(client.lastOrder).toLocaleDateString("pt-BR")
          : "N/A";

        addText(clientName, margin + 2, yPosition, 9);
        addText(
          (client.totalOrders || 0).toString(),
          margin + 100,
          yPosition,
          9
        );
        addText(
          `${(client.totalSpent || 0).toFixed(2)} MZN`,
          margin + 130,
          yPosition,
          9
        );
        addText(
          lastOrder,
          pageWidth - margin - 2,
          yPosition,
          9,
          false,
          undefined,
          "right"
        );
        yPosition += lineHeight + 2;
      });

      yPosition += sectionSpacing;

      // Produtos Mais Comprados
      checkPageBreak(40);
      addText("PRODUTOS MAIS COMPRADOS", margin, yPosition, 14, true);
      yPosition += lineHeight + 2;
      addLine(yPosition);
      yPosition += sectionSpacing;

      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, "F");
      addText("Produto", margin + 2, yPosition, 9, true);
      addText("Categoria", margin + 80, yPosition, 9, true);
      addText("Quantidade", margin + 130, yPosition, 9, true);
      addText(
        "Receita",
        pageWidth - margin - 2,
        yPosition,
        9,
        true,
        undefined,
        "right"
      );
      yPosition += 10;

      if (topProducts && topProducts.length > 0) {
        topProducts.forEach((product: any) => {
          checkPageBreak(10);
          addText(product.productName || "N/A", margin + 2, yPosition, 9);
          addText(
            product.category || "N/A",
            margin + 80,
            yPosition,
            9,
            false,
            secondaryColor
          );
          addText(
            (product.totalQuantity || 0).toString(),
            margin + 130,
            yPosition,
            9
          );
          addText(
            `${(product.totalRevenue || 0).toFixed(2)} MZN`,
            pageWidth - margin - 2,
            yPosition,
            9,
            false,
            undefined,
            "right"
          );
          yPosition += lineHeight + 2;
        });
      } else {
        addText(
          "Nenhum produto encontrado",
          margin + 2,
          yPosition,
          9,
          false,
          secondaryColor
        );
        yPosition += lineHeight;
      }

      yPosition += sectionSpacing;

      // Produtos Menos Comprados
      checkPageBreak(40);
      addText("PRODUTOS MENOS COMPRADOS", margin, yPosition, 14, true);
      yPosition += lineHeight + 2;
      addLine(yPosition);
      yPosition += sectionSpacing;

      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, "F");
      addText("Produto", margin + 2, yPosition, 9, true);
      addText("Categoria", margin + 80, yPosition, 9, true);
      addText("Quantidade", margin + 130, yPosition, 9, true);
      addText(
        "Receita",
        pageWidth - margin - 2,
        yPosition,
        9,
        true,
        undefined,
        "right"
      );
      yPosition += 10;

      if (leastSoldProducts && leastSoldProducts.length > 0) {
        leastSoldProducts.forEach((product: any) => {
          checkPageBreak(10);
          addText(product.productName || "N/A", margin + 2, yPosition, 9);
          addText(
            product.category || "N/A",
            margin + 80,
            yPosition,
            9,
            false,
            secondaryColor
          );
          addText(
            (product.totalQuantity || 0).toString(),
            margin + 130,
            yPosition,
            9
          );
          addText(
            `${(product.totalRevenue || 0).toFixed(2)} MZN`,
            pageWidth - margin - 2,
            yPosition,
            9,
            false,
            undefined,
            "right"
          );
          yPosition += lineHeight + 2;
        });
      } else {
        addText(
          "Nenhum produto encontrado",
          margin + 2,
          yPosition,
          9,
          false,
          secondaryColor
        );
        yPosition += lineHeight;
      }

      // Rodapé
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Gerar nome do arquivo com data
      const dateFileName = date.toLocaleDateString("pt-BR").replace(/\//g, "-");
      const fileName = `relatorio-${dateFileName}.pdf`;

      pdf.save(fileName);

      toast({
        title: "Sucesso!",
        description: "Relatório exportado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleRemoveCustomer = async (customerId: string, name: string) => {
    // Open confirmation dialog instead of using window.confirm
    setConfirmDialog({
      open: true,
      action: "removeCustomer",
      id: customerId,
      name,
    });
  };

  // Reset pagination when filters change
  const handleOrderFilterChange = (filter: string) => {
    setOrderFilter(filter);
    setOrdersPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setOrdersPage(1);
    setProductsPage(1);
  };

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchTerm(value);
    setCustomersPage(1);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditProductImageFile(null);
    setEditProductImagePreview(
      product.imageCover
        ? `${productionUrl}/img/products/${product.imageCover}`
        : ""
    );
    setVariantForm(createEmptyVariantForm());
    setIsEditDialogOpen(true);
  };

  const handleEditProductImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditProductImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditProductImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResetEditImage = () => {
    setEditProductImageFile(null);
    setEditProductImagePreview(
      editingProduct?.imageCover
        ? `${productionUrl}/img/products/${editingProduct.imageCover}`
        : ""
    );
  };

  const resetVariantFormState = () => {
    setVariantForm(createEmptyVariantForm());
    setIsEditVariantMode(false);
    setEditingVariant(null);
    skuManuallyEdited.current = false; // Resetar flag ao limpar formulário
    if (activeTab === "variants") {
      setSelectedProductForVariant("");
    }
  };

  // Função para gerar SKU automaticamente
  const generateSKU = (
    productName: string,
    color: string,
    size: string
  ): string => {
    if (!productName || !size) return "";

    // Normalizar texto: remover acentos, converter para minúsculas, substituir espaços por hífens
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
        .trim()
        .replace(/\s+/g, "-") // Substitui espaços por hífens
        .replace(/-+/g, "-"); // Remove hífens duplicados
    };

    const normalizedProduct = normalizeText(productName);
    const normalizedSize = normalizeText(size);

    // Converter cor hex para nome (se possível) ou usar código hex sem #
    let colorPart = "";
    if (color) {
      // Se for cor hex, tentar converter para nome comum ou usar código
      const hexToColorName: Record<string, string> = {
        "#000000": "preto",
        "#ffffff": "branco",
        "#ff0000": "vermelho",
        "#00ff00": "verde",
        "#0000ff": "azul",
        "#ffff00": "amarelo",
        "#ff00ff": "magenta",
        "#00ffff": "ciano",
        "#808080": "cinza",
        "#ffa500": "laranja",
        "#800080": "roxo",
        "#a52a2a": "marrom",
      };

      const lowerColor = color.toLowerCase();
      colorPart = hexToColorName[lowerColor] || lowerColor.replace("#", "");
    }

    const normalizedColor = colorPart ? normalizeText(colorPart) : "";

    // Montar SKU: produto-cor-tamanho (ou produto-tamanho se não houver cor)
    if (normalizedColor) {
      return `${normalizedProduct}-${normalizedColor}-${normalizedSize}`;
    }
    return `${normalizedProduct}-${normalizedSize}`;
  };

  // Ref para rastrear se o SKU foi editado manualmente
  const skuManuallyEdited = useRef(false);

  // Gerar SKU automaticamente quando produto, cor ou tamanho mudarem (apenas ao criar, não ao editar)
  useEffect(() => {
    // Só gerar se não estiver editando, tiver tamanho preenchido, produto selecionado e SKU não foi editado manualmente
    if (!isEditVariantMode && variantForm.size && !skuManuallyEdited.current) {
      const productId =
        activeTab === "variants"
          ? selectedProductForVariant
          : editingProduct?._id || (editingProduct as { id?: string })?.id;

      if (productId && products.length > 0) {
        const product = products.find(
          (p) => p._id === productId || p.id === productId
        );
        if (product && product.name) {
          const autoSKU = generateSKU(
            product.name,
            variantForm.color,
            variantForm.size
          );
          if (autoSKU) {
            setVariantForm((prev) => ({
              ...prev,
              sku: autoSKU,
            }));
          }
        }
      }
    }
  }, [
    selectedProductForVariant,
    editingProduct?._id,
    editingProduct?.id,
    variantForm.color,
    variantForm.size,
    isEditVariantMode,
    activeTab,
    products,
  ]);

  // Resetar flag quando entrar em modo de criação ou abrir o modal
  useEffect(() => {
    if (!isEditVariantMode && isVariantDialogOpen) {
      skuManuallyEdited.current = false;
      // Se já tiver produto e tamanho selecionados, gerar SKU imediatamente
      if (variantForm.size) {
        const productId =
          activeTab === "variants"
            ? selectedProductForVariant
            : editingProduct?._id || (editingProduct as { id?: string })?.id;

        if (productId && products.length > 0) {
          const product = products.find(
            (p) => p._id === productId || p.id === productId
          );
          if (product && product.name) {
            const autoSKU = generateSKU(
              product.name,
              variantForm.color,
              variantForm.size
            );
            if (autoSKU) {
              setVariantForm((prev) => ({
                ...prev,
                sku: autoSKU,
              }));
            }
          }
        }
      }
    }
  }, [
    isEditVariantMode,
    isVariantDialogOpen,
    activeTab,
    selectedProductForVariant,
    editingProduct,
    products,
    variantForm.size,
    variantForm.color,
  ]);

  const handleVariantImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setVariantForm((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) {
      toast({
        title: "Erro",
        description: "Selecione um produto para editar.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const payload = new FormData();

    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const priceDiscount = formData.get("priceDiscount") as string;
    const category = formData.get("category") as string;
    const gender = formData.get("gender") as string;
    const stock = formData.get("stock") as string;
    const description = formData.get("description") as string;

    payload.append("name", name);
    payload.append("price", price);
    // Adicionar priceDiscount apenas se preenchido
    if (priceDiscount && priceDiscount.trim() !== "") {
      payload.append("priceDiscount", priceDiscount);
    }
    payload.append("category", category);
    payload.append("gender", gender);
    payload.append("stock", stock || "0");

    // Adicionar descrição se preenchida
    if (description && description.trim() !== "") {
      payload.append("description", description);
    }

    if (editProductImageFile) {
      payload.append("imageCover", editProductImageFile);
    }

    try {
      const updated = await dispatch(
        updateProduct({
          productId: editingProduct._id,
          formData: payload,
        })
      ).unwrap();

      const productName =
        updated.name || name || editingProduct.name || "Produto";

      toast({
        title: "Produto atualizado!",
        description: `${productName} foi atualizado com sucesso.`,
      });

      setEditingProduct(updated);
      // Recarregar lista de produtos para garantir que todas as views
      // (aba de produtos, seleção de produto para variantes, etc.) sejam atualizadas
      // sem que o usuário precise recarregar a página.
      try {
        await dispatch(fetchAllProductsForAdmin());
      } catch (err) {
        // Não bloquear o fluxo principal se o fetch falhar
        console.warn("Falha ao recarregar produtos após atualização:", err);
      }
      setIsEditDialogOpen(false);
      setEditProductImageFile(null);
      setEditProductImagePreview("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar produto.";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleCreateVariant = async () => {
    // Se estiver editando, usar o produto da variante existente
    let productIdToUse: string | undefined;

    if (isEditVariantMode && editingVariant) {
      // Ao editar, pegar o produto da variante existente
      // O produto pode vir como objeto populado ou como string (ID)
      if (editingVariant.product) {
        if (
          typeof editingVariant.product === "object" &&
          editingVariant.product !== null
        ) {
          // Produto populado como objeto
          productIdToUse =
            (editingVariant.product as any)?._id ||
            (editingVariant.product as any)?.id;
        } else if (typeof editingVariant.product === "string") {
          // Produto como string (ID)
          productIdToUse = editingVariant.product;
        }
      }

      // Se ainda não encontrou o productId, tentar buscar na lista de produtos usando o nome do produto
      if (
        !productIdToUse &&
        typeof editingVariant.product === "object" &&
        editingVariant.product !== null
      ) {
        const productName = (editingVariant.product as any)?.name;
        if (productName) {
          const foundProduct = products.find((p) => p.name === productName);
          if (foundProduct) {
            productIdToUse = foundProduct._id || foundProduct.id;
          }
        }
      }

      // Debug: se ainda não encontrou, logar para debug
      if (!productIdToUse) {
        console.warn("⚠️ Não foi possível extrair productId da variante:", {
          variantId: editingVariant._id,
          product: editingVariant.product,
          productType: typeof editingVariant.product,
        });
      }
    } else {
      // Ao criar, usar selectedProductForVariant se estiver na aba de variantes, senão usar editingProduct
      productIdToUse =
        activeTab === "variants"
          ? selectedProductForVariant
          : editingProduct?._id || (editingProduct as { id?: string })?.id;
    }

    // Só validar se não estiver editando (ao editar, o produto já está associado)
    if (!isEditVariantMode && !productIdToUse) {
      toast({
        title: "Selecione um produto",
        description:
          activeTab === "variants"
            ? "Selecione um produto para adicionar variantes."
            : "Abra um produto para adicionar variantes.",
        variant: "destructive",
      });
      return;
    }

    // Se estiver editando e ainda não tem productId, mostrar erro mais específico
    if (isEditVariantMode && !productIdToUse) {
      console.error(
        "❌ Erro ao editar variante: productId não encontrado",
        editingVariant
      );
      toast({
        title: "Erro",
        description:
          "Não foi possível identificar o produto da variante. Por favor, recarregue a página e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    if (!variantForm.size || !variantForm.sku || variantForm.stock <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe tamanho, SKU e estoque da variante.",
        variant: "destructive",
      });
      return;
    }

    if (!variantForm.imageFile && !isEditVariantMode) {
      toast({
        title: "Imagem obrigatória",
        description: "Selecione uma imagem para a variante.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("color", variantForm.color);
    formData.append("size", variantForm.size);
    formData.append("sku", variantForm.sku);
    formData.append("stock", String(variantForm.stock));
    formData.append("product", productIdToUse);
    if (variantForm.imageFile) {
      formData.append("image", variantForm.imageFile);
    }

    // If editing and a new image was provided, inform the backend to
    // remove the previous image file (so it can be deleted from
    // public/variants) and include the previous filename when present.
    if (isEditVariantMode && editingVariant && variantForm.imageFile) {
      formData.append("deletePreviousImage", "true");
      if (editingVariant.image) {
        formData.append("previousImage", String(editingVariant.image));
      }
    }

    try {
      if (isEditVariantMode && editingVariant) {
        // Atualizar variante existente
        const updatedVariant = await dispatch(
          updateVariant({ variantId: editingVariant._id, formData })
        ).unwrap();

        toast({
          title: "Variante atualizada!",
          description: `SKU ${updatedVariant.sku} foi atualizada.`,
        });

        // Se estiver na aba de variantes, não precisa atualizar editingProduct
        if (activeTab !== "variants" && editingProduct) {
          setEditingProduct((prev) =>
            prev
              ? {
                  ...prev,
                  variants: (prev.variants || prev.variations || []).map((v) =>
                    v._id === editingVariant._id ? updatedVariant : v
                  ),
                }
              : prev
          );
        }
        setIsEditVariantMode(false);
        setEditingVariant(null);
        // Recarregar produtos e variantes para atualizar as listas
        await dispatch(fetchAllProductsForAdmin());
        if (activeTab === "variants") {
          await dispatch(fetchAllVariants());
        }
        // Limpar produto selecionado após editar
        if (activeTab === "variants") {
          setSelectedProductForVariant("");
        }
        setIsVariantDialogOpen(false);
      } else {
        // Criar nova variante
        const createdVariant = await dispatch(createVariant(formData)).unwrap();

        toast({
          title: "Variante criada!",
          description: `SKU ${createdVariant.sku} adicionada ao produto.`,
        });

        // Se estiver na aba de variantes, não precisa atualizar editingProduct
        if (activeTab !== "variants" && editingProduct) {
          setEditingProduct((prev) =>
            prev
              ? {
                  ...prev,
                  variants: [
                    ...(prev.variants || prev.variations || []),
                    createdVariant,
                  ],
                }
              : prev
          );
        }
        // Recarregar produtos e variantes para atualizar as listas
        await dispatch(fetchAllProductsForAdmin());
        if (activeTab === "variants") {
          await dispatch(fetchAllVariants());
        }
        setIsVariantDialogOpen(false);
      }
      resetVariantFormState();
      // Limpar produto selecionado se estiver na aba de variantes e não estiver editando
      if (activeTab === "variants" && !isEditVariantMode) {
        setSelectedProductForVariant("");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar variante.";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleEditVariant = (variant: ProductVariation) => {
    setEditingVariant(variant);
    setIsEditVariantMode(true);
    setVariantForm({
      color: variant.color || "#000000",
      size: variant.size || "",
      sku: variant.sku || "",
      stock: variant.stock || 0,
      imagePreview: variant.image
        ? `${productionUrl}/img/variants/${variant.image}`
        : "",
      imageFile: null,
    });
    setIsVariantDialogOpen(true);
  };

  const handleDeleteVariant = (variant: ProductVariation) => {
    setConfirmDialog({
      open: true,
      action: "deleteVariant",
      variantId: variant._id,
      variantSku: variant.sku,
      name: `${variant.sku} • ${variant.size}`,
    });
  };

  const handleCancelEditVariant = () => {
    setIsEditVariantMode(false);
    setEditingVariant(null);
    resetVariantFormState();
  };

  const handleDeleteProduct = async (product: Product) => {
    const productId = product._id || product.id;

    if (!productId) {
      toast({
        title: "Erro",
        description: "ID do produto inválido.",
        variant: "destructive",
      });
      return;
    }
    // Open confirmation dialog for product deletion
    setConfirmDialog({
      open: true,
      action: "deleteProduct",
      id: productId,
      name: product.name,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      pendente: { label: "Pendente", variant: "secondary" },
      confirmado: { label: "Confirmado", variant: "default" },
      enviado: { label: "Enviado", variant: "default" },
      entregue: { label: "Entregue", variant: "outline" },
      cancelado: { label: "Cancelado", variant: "destructive" },
      // English aliases (in case some data or older code uses English keys)
      pending: { label: "Pendente", variant: "secondary" },
      processing: { label: "Confirmado", variant: "default" },
      delivered: { label: "Entregue", variant: "outline" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };

    const config = statusMap[status] || statusMap.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusCount = (status: string) => {
    const normalize: Record<string, string> = {
      pending: "pendente",
      processing: "confirmado",
      delivered: "entregue",
      cancelled: "cancelado",
    };

    if (status === "all") return allOrders.length;
    const norm = normalize[status] || status;
    return allOrders.filter((order) => order.status === norm).length;
  };

  // Order status update helper
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleChangeOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      setIsUpdatingStatus(true);

      // Se for marcar como "entregue", verificar se o cliente confirmou primeiro
      if (newStatus === "entregue") {
        try {
          const orderResult = await dispatch(fetchOrderById(orderId)).unwrap();
          const actualOrder = (orderResult as any)?.data || orderResult;

          if (!actualOrder.clientConfirmed) {
            toast({
              title: "Confirmação necessária",
              description:
                "O cliente precisa confirmar o recebimento antes de marcar como entregue.",
              variant: "destructive",
            });
            setIsUpdatingStatus(false);
            return;
          }
        } catch (fetchError: any) {
          console.error(
            "❌ Erro ao verificar confirmação do cliente:",
            fetchError
          );
          toast({
            title: "Erro",
            description: "Não foi possível verificar a confirmação do cliente.",
            variant: "destructive",
          });
          setIsUpdatingStatus(false);
          return;
        }
      }

      // SEMPRE buscar o pedido completo da API ANTES de atualizar para garantir dados corretos
      let userId: string | null = null;
      let orderData: Order | null = null;

      try {
        const orderResult = await dispatch(fetchOrderById(orderId)).unwrap();

        // A API retorna { data: { ... } }, então precisamos acessar orderResult.data
        const actualOrder = (orderResult as any)?.data || orderResult;
        orderData = actualOrder;

        // Extrair userId - tentar múltiplas formas
        if (actualOrder.user) {
          if (typeof actualOrder.user === "string") {
            userId = actualOrder.user;
          } else if (
            typeof actualOrder.user === "object" &&
            actualOrder.user !== null
          ) {
            // Tentar todas as propriedades possíveis
            const userObj = actualOrder.user as any;
            userId = userObj._id || userObj.id || userObj.userId || null;
          }
        } else {
          console.warn("⚠️ actualOrder.user está vazio/null/undefined");
        }

        // Se ainda não encontrou userId, tentar de outras fontes
        if (!userId) {
          // Tentar do currentOrder
          if (
            currentOrder &&
            (currentOrder._id === orderId || currentOrder.id === orderId)
          ) {
            if (typeof currentOrder.user === "string") {
              userId = currentOrder.user;
            } else if (
              currentOrder.user &&
              typeof currentOrder.user === "object"
            ) {
              const userObj = currentOrder.user as any;
              userId = userObj._id || userObj.id || userObj.userId || null;
            }
          }

          // Tentar da lista de pedidos
          if (!userId) {
            const orderFromList = allOrders.find(
              (o) => o.id === orderId || o._id === orderId
            );
            if (orderFromList && orderFromList.user) {
              if (typeof orderFromList.user === "string") {
                userId = orderFromList.user;
              } else if (typeof orderFromList.user === "object") {
                const userObj = orderFromList.user as any;
                userId = userObj._id || userObj.id || userObj.userId || null;
              }
            }
          }
        }
      } catch (fetchError: any) {
        console.error("❌ Erro ao buscar pedido:", fetchError);

        toast({
          title: "Erro",
          description: `Não foi possível buscar os dados do pedido: ${
            fetchError?.message || "Erro desconhecido"
          }`,
          variant: "destructive",
        });
        setIsUpdatingStatus(false);
        return;
      }

      // Verificar se temos userId antes de continuar
      if (!userId) {
        console.error("❌ userId não encontrado após todas as tentativas");
        console.error("❌ Dados disponíveis:", {
          orderData: orderData
            ? {
                exists: true,
                hasUser: !!orderData.user,
                userType: typeof orderData.user,
                keys: Object.keys(orderData),
              }
            : "não existe",
          currentOrder: currentOrder
            ? {
                exists: true,
                hasUser: !!currentOrder.user,
                userType: typeof currentOrder.user,
                id: currentOrder._id || currentOrder.id,
              }
            : "não existe",
          allOrdersCount: allOrders.length,
          orderInList: allOrders.find(
            (o) => o.id === orderId || o._id === orderId
          )
            ? {
                found: true,
                hasUser: !!allOrders.find(
                  (o) => o.id === orderId || o._id === orderId
                )?.user,
              }
            : "não encontrado",
        });
        toast({
          title: "Erro",
          description:
            "Não foi possível identificar o cliente do pedido. Abra o console (F12) para ver detalhes de debug.",
          variant: "destructive",
        });
        setIsUpdatingStatus(false);
        return;
      }

      // Atualizar o status do pedido
      await dispatch(
        updateOrder({ orderId, payload: { status: newStatus as OrderStatus } })
      ).unwrap();

      toast({
        title: "Status atualizado",
        description: `Pedido atualizado para ${newStatus}`,
      });

      // Criar notificação para o cliente baseado no status
      const statusMessages: Record<
        string,
        {
          title: string;
          message: string;
          type: "Pedido" | "Entregue" | "Cancelado";
        }
      > = {
        confirmado: {
          title: "Pedido Confirmado",
          message: `Seu pedido #${orderId.slice(
            -8
          )} foi confirmado e está sendo preparado.`,
          type: "Pedido",
        },
        enviado: {
          title: "Pedido Enviado",
          message: `Seu pedido #${orderId.slice(
            -8
          )} foi enviado e está a caminho. Por favor, confirme o recebimento quando o pedido chegar.`,
          type: "Pedido",
        },
        entregue: {
          title: "Pedido Entregue",
          message: `Seu pedido #${orderId.slice(
            -8
          )} foi entregue com sucesso! Obrigado pela compra.`,
          type: "Entregue",
        },
        cancelado: {
          title: "Pedido Cancelado",
          message: `Seu pedido #${orderId.slice(
            -8
          )} foi cancelado. Entre em contato conosco se tiver dúvidas.`,
          type: "Cancelado",
        },
      };

      const notificationData = statusMessages[newStatus];
      if (notificationData) {
        try {
          await dispatch(
            createNotification({
              title: notificationData.title,
              message: notificationData.message,
              type: notificationData.type,
              user: userId,
              order: orderId,
            })
          ).unwrap();
        } catch (notificationError: any) {
          console.error(
            "❌ Erro ao criar notificação de status:",
            notificationError
          );
          toast({
            title: "Aviso",
            description:
              "Status atualizado, mas não foi possível criar notificação.",
            variant: "destructive",
          });
        }
      }

      // Se o pedido foi entregue, criar notificações para avaliar os produtos
      if (newStatus === "entregue") {
        // Buscar pedido atualizado após mudança de status para garantir produtos populados
        // Usar actualOrder que já tem a estrutura correta (orderResult.data)
        let finalOrderData = orderData;

        if (
          !finalOrderData ||
          !finalOrderData.products ||
          finalOrderData.products.length === 0
        ) {
          try {
            const updatedOrderResult = await dispatch(
              fetchOrderById(orderId)
            ).unwrap();
            // A API retorna { data: { ... } }, então precisamos acessar orderResult.data
            finalOrderData =
              (updatedOrderResult as any)?.data || updatedOrderResult;
          } catch (e: any) {
            console.error("❌ Erro ao buscar pedido atualizado:", e);
          }
        }

        if (
          finalOrderData &&
          finalOrderData.products &&
          finalOrderData.products.length > 0
        ) {
          try {
            // Obter produtos únicos do pedido
            const uniqueProducts = new Map<
              string,
              { id: string; name: string }
            >();

            finalOrderData.products.forEach((orderProduct: any) => {
              // Tentar obter o ID do produto
              let productId: string | null = null;
              if (typeof orderProduct.product === "string") {
                productId = orderProduct.product;
              } else if (
                orderProduct.product &&
                typeof orderProduct.product === "object"
              ) {
                productId =
                  (orderProduct.product as any)?._id ||
                  (orderProduct.product as any)?.id ||
                  null;
              } else {
                console.warn(
                  "⚠️ orderProduct.product não é string nem objeto:",
                  orderProduct.product
                );
              }

              if (productId) {
                // Tentar obter o nome do produto
                let productName = "produto";

                // Primeiro tentar do orderProduct.name (se estiver populado)
                if (orderProduct.name) {
                  productName = orderProduct.name;
                }
                // Se não, tentar do objeto product populado
                else if (
                  orderProduct.product &&
                  typeof orderProduct.product === "object"
                ) {
                  productName =
                    (orderProduct.product as any)?.name || "produto";
                }

                // Adicionar ao mapa (sobrescreve se já existir, mantendo o nome mais completo)
                if (
                  !uniqueProducts.has(productId) ||
                  uniqueProducts.get(productId)?.name === "produto"
                ) {
                  uniqueProducts.set(productId, {
                    id: productId,
                    name: productName,
                  });
                }
              }
            });

            // Criar uma notificação para cada produto único
            let notificationsCreated = 0;
            for (const [productId, productInfo] of uniqueProducts) {
              try {
                await dispatch(
                  createNotification({
                    title: "Avalie seu produto",
                    message: `Seu pedido #${orderId.slice(
                      -8
                    )} foi entregue! Que tal avaliar o ${
                      productInfo.name
                    }? Sua opinião é muito importante para nós.`,
                    type: "Avaliação",
                    user: userId,
                    order: orderId,
                  })
                ).unwrap();
                notificationsCreated++;
              } catch (productNotificationError: any) {
                console.error(
                  `❌ Erro ao criar notificação de avaliação para ${productInfo.name}:`,
                  productNotificationError
                );
              }
            }
          } catch (e: any) {
            console.error("❌ Erro ao processar produtos para avaliação:", e);
            toast({
              title: "Aviso",
              description:
                "Pedido marcado como entregue, mas não foi possível criar todas as notificações de avaliação.",
              variant: "destructive",
            });
          }
        } else {
          console.warn(
            "⚠️ Pedido marcado como entregue, mas não há produtos para criar notificações"
          );
        }
      }

      // Refresh orders list
      await dispatch(fetchOrders(undefined)).unwrap();

      // If the modal is open for this order, refresh the single order details too
      if (selectedOrder === orderId) {
        try {
          await dispatch(fetchOrderById(orderId)).unwrap();
        } catch (e) {
          // ignore single-order refresh failure, list is already refreshed
        }
      }

      // close modal? keep it open but update content
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o status do pedido";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Wrap status change with confirmation for destructive actions
  // Previously used window.confirm; now use the confirm Dialog below.
  const handleConfirmDialog = async () => {
    if (!confirmDialog.action) return;
    setIsConfirming(true);
    try {
      if (confirmDialog.action === "removeCustomer" && confirmDialog.id) {
        await dispatch(deleteUser(confirmDialog.id)).unwrap();
        // Recarregar lista de usuários para atualizar a tabela automaticamente
        try {
          await dispatch(fetchUsers()).unwrap();
        } catch (e) {
          // se o re-fetch falhar, apenas logamos e continuamos (a remoção já ocorreu)
          console.warn("Falha ao recarregar usuários após exclusão:", e);
        }
        // Garantir que a paginação volte para a primeira página visível
        setCustomersPage(1);

        toast({
          title: "Cliente desativado",
          description: `"${
            confirmDialog.name || ""
          }" foi desativado com sucesso.`,
        });
      } else if (confirmDialog.action === "cancelOrder" && confirmDialog.id) {
        await handleChangeOrderStatus(confirmDialog.id, "cancelado");
      } else if (confirmDialog.action === "deleteProduct" && confirmDialog.id) {
        await dispatch(deleteProduct({ productId: confirmDialog.id })).unwrap();
        toast({
          title: "Produto eliminado",
          description: `"${
            confirmDialog.name || ""
          }" foi removido do catálogo.`,
        });
      } else if (confirmDialog.action === "deleteCoupon" && confirmDialog.id) {
        await dispatch(deleteCoupon(confirmDialog.id)).unwrap();
        toast({
          title: "Cupom removido",
          description: `O cupom "${confirmDialog.name || ""}" foi removido.`,
        });
        await dispatch(getAllCoupons());
      } else if (
        confirmDialog.action === "deleteReview" &&
        confirmDialog.reviewId
      ) {
        await dispatch(deleteReview(confirmDialog.reviewId)).unwrap();
        toast({
          title: "Comentário excluído",
          description: "O comentário foi removido com sucesso.",
        });
        // Não recarregar reviews - o slice já atualiza o estado localmente
      } else if (
        confirmDialog.action === "deleteVariant" &&
        confirmDialog.variantId
      ) {
        await dispatch(
          deleteVariant({ variantId: confirmDialog.variantId })
        ).unwrap();
        toast({
          title: "Variante eliminada",
          description: `A variante "${
            confirmDialog.variantSku || ""
          }" foi removida com sucesso.`,
        });
        // Atualizar o produto editado removendo a variante
        if (editingProduct) {
          setEditingProduct((prev) =>
            prev
              ? {
                  ...prev,
                  variants: (prev.variants || prev.variations || []).filter(
                    (v) => v._id !== confirmDialog.variantId
                  ),
                }
              : prev
          );
        }
        // Recarregar produtos e variantes para atualizar as listas
        await dispatch(fetchAllProductsForAdmin());
        if (activeTab === "variants") {
          await dispatch(fetchAllVariants());
        }
      }
    } catch (err: unknown) {
      // Extrair mensagem de erro de forma mais robusta
      let errorMessage = "Erro ao processar a ação";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if ((err as any)?.message) {
        errorMessage = (err as any).message;
      } else if ((err as any)?.response?.data?.message) {
        errorMessage = (err as any).response.data.message;
      } else if ((err as any)?.payload) {
        errorMessage = (err as any).payload;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // keep file for upload
      setProductImageFile(file);

      // create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearForm = () => {
    // Limpar o formulário usando a ref
    if (productFormRef.current) {
      productFormRef.current.reset();
    }
    // Limpar todos os estados relacionados
    setProductImage("");
    setProductImageFile(null);
    setVariants([]);
    // Limpar o variantForm também
    setVariantForm(createEmptyVariantForm());
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const productData = {
        name: formData.get("name") as string,
        price: parseFloat(formData.get("price") as string),
        category: formData.get("category") as string,
        gender: formData.get("gender") as string,
        description: formData.get("description") as string,
        stock: parseInt(formData.get("stock") as string) || 0,
        imageCover: productImageFile,
      };

      // Despache thunk para criar produto usando FormData (multipart)
      const form = new FormData();
      form.append("name", productData.name);
      form.append("price", String(productData.price));
      form.append("category", productData.category);
      form.append("gender", productData.gender);
      form.append("description", productData.description);
      form.append("stock", String(productData.stock));

      // Main image file (prefer file; fallback to nothing)
      if (productImageFile) {
        form.append("imageCover", productImageFile);
      }

      await dispatch(createProduct(form)).unwrap();

      toast({
        title: "Produto cadastrado!",
        description: `${productData.name} foi adicionado com sucesso.`,
      });

      // Recarregar produtos após criar (admin vê TODOS, incluindo fora de estoque)
      await dispatch(fetchAllProductsForAdmin());

      // Resetar formulário se ainda existir
      if (e.currentTarget) {
        e.currentTarget.reset();
      }
      setProductImage("");
      setProductImageFile(null);
    } catch (error: any) {
      console.error("Erro ao cadastrar produto:", error);
      // O erro pode vir como objeto com message ou como string
      const errorMsg =
        error?.message ||
        (typeof error === "string" ? error : "Erro ao cadastrar produto");
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-background">
      <Header />

      <div className="container px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
              Painel Administrativo
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie pedidos e produtos da loja
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            defaultValue="orders"
            className="w-full"
          >
            <TabsList
              className={`grid w-full ${
                isManager ? "grid-cols-5" : "grid-cols-8"
              } h-auto p-1 overflow-x-auto`}
            >
              <TabsTrigger
                value="orders"
                className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Pedidos</span>
              </TabsTrigger>
              {!isManager && (
                <TabsTrigger
                  value="customers"
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Clientes</span>
                </TabsTrigger>
              )}
              {!isManager && (
                <TabsTrigger
                  value="reports"
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Relatórios</span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value="products"
                className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Produtos</span>
              </TabsTrigger>
              <TabsTrigger
                value="variants"
                className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Variantes</span>
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Comentários</span>
              </TabsTrigger>
              {!isManager && (
                <TabsTrigger
                  value="coupons"
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Ticket className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Cupons</span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value="add-product"
                className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Novo</span>
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">
                        Gestão de Pedidos
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {filteredOrders.length} pedidos encontrados
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por cliente ou ID..."
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={orderFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleOrderFilterChange("all")}
                      className="text-xs sm:text-sm"
                    >
                      Todos ({getStatusCount("all")})
                    </Button>
                    <Button
                      variant={
                        orderFilter === "pendente" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleOrderFilterChange("pendente")}
                      className="text-xs sm:text-sm"
                    >
                      Pendentes ({getStatusCount("pendente")})
                    </Button>
                    <Button
                      variant={
                        orderFilter === "confirmado" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleOrderFilterChange("confirmado")}
                      className="text-xs sm:text-sm"
                    >
                      Confirmados ({getStatusCount("confirmado")})
                    </Button>
                    <Button
                      variant={
                        orderFilter === "enviado" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleOrderFilterChange("enviado")}
                      className="text-xs sm:text-sm"
                    >
                      Entregues ({getStatusCount("enviado")})
                    </Button>
                    <Button
                      variant={
                        orderFilter === "cancelado" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleOrderFilterChange("cancelado")}
                      className="text-xs sm:text-sm"
                    >
                      Cancelados ({getStatusCount("cancelado")})
                    </Button>
                  </div>

                  <Separator />

                  {/* Orders List */}
                  <div className="space-y-3 sm:space-y-4">
                    {paginatedOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 sm:p-4 border border-border rounded-lg hover:border-accent transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-semibold text-sm sm:text-base text-foreground break-words">
                                Pedido #{order.id?.slice(-8)}
                              </h3>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1 break-words">
                              Cliente: {order.customerName}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Data:{" "}
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString(
                                    "pt-BR"
                                  )
                                : order.date || "Data não disponível"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                            <div className="text-left sm:text-right">
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {order.items} itens
                              </p>
                              <p className="text-base sm:text-lg font-bold text-foreground">
                                {order.total.toFixed(2)} MZN
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order.id)}
                              className="text-xs sm:text-sm whitespace-nowrap"
                            >
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredOrders.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        Nenhum pedido encontrado
                      </div>
                    )}
                  </div>

                  {/* Pagination for Orders */}
                  {filteredOrders.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4">
                      <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                        Mostrando {(ordersPage - 1) * itemsPerPage + 1} a{" "}
                        {Math.min(
                          ordersPage * itemsPerPage,
                          filteredOrders.length
                        )}{" "}
                        de {filteredOrders.length} pedidos
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setOrdersPage((p) => Math.max(1, p - 1))
                          }
                          disabled={ordersPage === 1}
                          className="text-xs sm:text-sm"
                        >
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1 overflow-x-auto">
                          {Array.from(
                            { length: totalOrdersPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <Button
                              key={page}
                              variant={
                                page === ordersPage ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setOrdersPage(page)}
                              className="w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setOrdersPage((p) =>
                              Math.min(totalOrdersPages, p + 1)
                            )
                          }
                          disabled={ordersPage === totalOrdersPages}
                          className="text-xs sm:text-sm"
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customers Tab - Apenas para admin */}
            {!isManager && (
              <TabsContent value="customers" className="mt-6">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">
                          Gestão de Clientes
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {filteredCustomers.length} clientes cadastrados
                        </CardDescription>
                      </div>
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar clientes..."
                          value={customerSearchTerm}
                          onChange={(e) =>
                            handleCustomerSearchChange(e.target.value)
                          }
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {paginatedCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className="p-3 sm:p-4 border border-border rounded-lg hover:border-accent transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                <h3 className="font-semibold text-sm sm:text-base text-foreground break-words">
                                  {customer.name}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  ID: {customer.id?.slice(-8)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 break-words">
                                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {customer.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {customer.phone}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2 sm:col-span-2">
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                                  <span className="break-words">
                                    {customer.address}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm">
                                    Cliente desde:{" "}
                                    {new Date(
                                      customer.joinDate
                                    ).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 sm:hidden">
                                <p className="text-xs text-muted-foreground">
                                  {customer.totalOrders} pedidos
                                </p>
                                <p className="text-base font-bold text-foreground">
                                  {customer.totalSpent} MZN
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right mr-4 hidden sm:block">
                                <p className="text-sm text-muted-foreground">
                                  {customer.totalOrders} pedidos
                                </p>
                                <p className="text-lg font-bold text-foreground">
                                  {customer.totalSpent} MZN
                                </p>
                              </div>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setSelectedCustomer(customer)
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">
                                      Detalhes
                                    </span>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[95vw] sm:max-w-2xl p-4 sm:p-6">
                                  <DialogHeader className="pb-4">
                                    <DialogTitle className="text-lg sm:text-xl">
                                      Detalhes do Cliente
                                    </DialogTitle>
                                    <DialogDescription className="text-xs sm:text-sm">
                                      Informações completas sobre{" "}
                                      {customer.name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedCustomer && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-xs sm:text-sm text-muted-foreground">
                                            ID do Cliente
                                          </Label>
                                          <p className="font-semibold text-sm sm:text-base">
                                            {selectedCustomer.id?.slice(-8)}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-xs sm:text-sm text-muted-foreground">
                                            Nome Completo
                                          </Label>
                                          <p className="font-semibold text-sm sm:text-base break-words">
                                            {selectedCustomer.name}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-xs sm:text-sm text-muted-foreground">
                                            Email
                                          </Label>
                                          <p className="font-semibold text-sm sm:text-base break-words">
                                            {selectedCustomer.email}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-xs sm:text-sm text-muted-foreground">
                                            Telefone
                                          </Label>
                                          <p className="font-semibold text-sm sm:text-base">
                                            {selectedCustomer.phone}
                                          </p>
                                        </div>
                                        <div className="col-span-1 sm:col-span-2">
                                          <Label className="text-xs sm:text-sm text-muted-foreground">
                                            Endereço
                                          </Label>
                                          <p className="font-semibold text-sm sm:text-base break-words">
                                            {selectedCustomer.address}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-xs sm:text-sm text-muted-foreground">
                                            Cliente desde
                                          </Label>
                                          <p className="font-semibold text-sm sm:text-base">
                                            {new Date(
                                              selectedCustomer.joinDate
                                            ).toLocaleDateString("pt-BR")}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-xs sm:text-sm text-muted-foreground">
                                            Último Pedido
                                          </Label>
                                          <p className="font-semibold text-sm sm:text-base">
                                            {new Date(
                                              selectedCustomer.lastOrder
                                            ).toLocaleDateString("pt-BR")}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-xs sm:text-sm text-muted-foreground">
                                            Total de Pedidos
                                          </Label>
                                          <p className="font-semibold text-sm sm:text-base text-accent">
                                            {selectedCustomer.totalOrders}{" "}
                                            pedidos
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-xs sm:text-sm text-muted-foreground">
                                            Total Gasto
                                          </Label>
                                          <p className="font-semibold text-sm sm:text-base text-accent">
                                            {selectedCustomer.totalSpent} MZN
                                          </p>
                                        </div>
                                      </div>
                                      {/* <Separator />
                                    <div>
                                      <h4 className="font-semibold mb-2">
                                        Histórico de Pedidos Recentes
                                      </h4>
                                      <div className="space-y-2">
                                        {allOrders
                                          .filter(
                                            (order) =>
                                              order.customerName ===
                                              selectedCustomer.name
                                          )
                                          .map((order) => (
                                            <div
                                              key={order.id}
                                              className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                              <div>
                                                <p className="font-medium">
                                                  Pedido #{order.id?.slice(-8)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                  {new Date(
                                                    order.date
                                                  ).toLocaleDateString("pt-BR")}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                {getStatusBadge(order.status)}
                                                <p className="font-bold">
                                                  {order.total.toFixed(2)} MZN
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    </div> */}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleRemoveCustomer(
                                    customer.id,
                                    customer.name
                                  )
                                }
                                aria-label="Desativar cliente"
                                title="Desativar cliente"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {filteredCustomers.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          Nenhum cliente encontrado
                        </div>
                      )}
                    </div>

                    {/* Pagination for Customers */}
                    {filteredCustomers.length > itemsPerPage && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4">
                        <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                          Mostrando {(customersPage - 1) * itemsPerPage + 1} a{" "}
                          {Math.min(
                            customersPage * itemsPerPage,
                            filteredCustomers.length
                          )}{" "}
                          de {filteredCustomers.length} clientes
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCustomersPage((p) => Math.max(1, p - 1))
                            }
                            disabled={customersPage === 1}
                            className="text-xs sm:text-sm"
                          >
                            Anterior
                          </Button>
                          <div className="flex items-center gap-1 overflow-x-auto">
                            {Array.from(
                              { length: totalCustomersPages },
                              (_, i) => i + 1
                            ).map((page) => (
                              <Button
                                key={page}
                                variant={
                                  page === customersPage ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCustomersPage(page)}
                                className="w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm"
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCustomersPage((p) =>
                                Math.min(totalCustomersPages, p + 1)
                              )
                            }
                            disabled={customersPage === totalCustomersPages}
                            className="text-xs sm:text-sm"
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Reports Tab - Apenas para admin */}
            {!isManager && (
              <TabsContent value="reports" className="mt-6">
                <div className="space-y-6" ref={reportRef}>
                  {/* Header com botão de exportar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                        Dashboard
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Visão geral das vendas e relatórios
                      </p>
                    </div>
                    <Button
                      onClick={handleExportPDF}
                      disabled={isExportingPDF || reportLoading}
                      className="bg-black text-white hover:bg-black/90 gap-2 px-4 py-2 h-auto"
                      data-export-button
                    >
                      {isExportingPDF ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          Exportando...
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4" />
                          Exportar Relatório
                        </>
                      )}
                    </Button>
                  </div>
                  {/* Summary Cards */}
                  <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                          Receita Total
                        </CardTitle>
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <div className="text-xl sm:text-2xl font-bold">
                          {reportLoading ? (
                            <Skeleton className="h-6 w-20 sm:w-24" />
                          ) : (
                            `${totalRevenue} MZN`
                          )}
                        </div>
                        {reportLoading ? (
                          <Skeleton className="h-3 w-24 sm:w-32 mt-2" />
                        ) : (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            De {totalOrders} pedidos
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                          Ticket Médio
                        </CardTitle>
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <div className="text-xl sm:text-2xl font-bold">
                          {reportLoading ? (
                            <Skeleton className="h-6 w-16 sm:w-20" />
                          ) : (
                            `${averageTicket} MZN`
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          Por pedido
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                          Total de Pedidos
                        </CardTitle>
                        <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <div className="text-xl sm:text-2xl font-bold">
                          {reportLoading ? (
                            <Skeleton className="h-6 w-10 sm:w-12" />
                          ) : (
                            totalOrdersValue
                          )}
                        </div>
                        {reportLoading ? (
                          <Skeleton className="h-3 w-16 sm:w-20 mt-2" />
                        ) : (
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            {deliveredOrders} entregues
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                          Taxa de Entrega
                        </CardTitle>
                        <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <div className="text-xl sm:text-2xl font-bold">
                          {reportLoading ? (
                            <Skeleton className="h-6 w-10 sm:w-12" />
                          ) : (
                            `${deliveryRate}%`
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          De todos os pedidos
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sales by Status */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg sm:text-xl">
                        Vendas por Status
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Distribuição de pedidos por status
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Quantidade
                              </TableHead>
                              <TableHead className="text-right">
                                Valor Total
                              </TableHead>
                              <TableHead className="text-right">
                                Percentual
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {salesByStatus && salesByStatus.length > 0
                              ? salesByStatus.map((s) => (
                                  <TableRow key={s.status}>
                                    <TableCell>
                                      {getStatusBadge(s.status)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {s.count}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {s.total.toFixed(2)} MZN
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {(
                                        (s.count / (totalOrdersValue || 1)) *
                                        100
                                      ).toFixed(1)}
                                      %
                                    </TableCell>
                                  </TableRow>
                                ))
                              : [
                                  "pendente",
                                  "confirmado",
                                  "enviado",
                                  "entregue",
                                  "cancelado",
                                ].map((status) => {
                                  const ordersWithStatus = allOrders.filter(
                                    (o) => o.status === status
                                  );
                                  const total = ordersWithStatus.reduce(
                                    (sum, o) => sum + o.total,
                                    0
                                  );
                                  const percentage =
                                    (ordersWithStatus.length /
                                      (totalOrdersValue || 1)) *
                                    100;

                                  return (
                                    <TableRow key={status}>
                                      <TableCell>
                                        {getStatusBadge(status)}
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {ordersWithStatus.length}
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {total.toFixed(2)} MZN
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {percentage.toFixed(1)}%
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Customers */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg sm:text-xl">
                        Principais Clientes
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Clientes com maior volume de compras
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="overflow-x-auto">
                        {reportLoading ? (
                          <div className="space-y-4">
                            {[...Array(5)].map((_, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4"
                              >
                                <Skeleton className="h-12 flex-1" />
                                <Skeleton className="h-12 w-20" />
                                <Skeleton className="h-12 w-24" />
                                <Skeleton className="h-12 w-28" />
                                <Skeleton className="h-12 w-24" />
                                <Skeleton className="h-12 w-32" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="text-right">
                                  Pedidos
                                </TableHead>
                                <TableHead className="text-right">
                                  Total Gasto
                                </TableHead>
                                <TableHead className="text-right">
                                  Último Pedido
                                </TableHead>
                                <TableHead className="text-center">
                                  Cupons Atribuídos
                                </TableHead>
                                <TableHead className="text-right">
                                  Ações
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topClients && topClients.length > 0
                                ? topClients.slice(0, 5).map((c, idx) => (
                                    <TableRow key={c.id || `topClient-${idx}`}>
                                      <TableCell className="font-medium">
                                        {c.clientName}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {c.totalOrders}
                                      </TableCell>
                                      <TableCell className="text-right font-semibold text-accent">
                                        {c.totalSpent.toFixed(2)} MZN
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {c.lastOrder}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {apiCoupons.filter(
                                          (coupon) =>
                                            coupon.assignedTo === c.clientId &&
                                            coupon.isActive // Use clientId aqui
                                        ).length > 0 ? (
                                          <Badge variant="secondary">
                                            {
                                              apiCoupons.filter(
                                                (coupon) =>
                                                  coupon.assignedTo ===
                                                    c.clientId &&
                                                  coupon.isActive
                                              ).length
                                            }
                                          </Badge>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">
                                            Nenhum
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Dialog
                                          open={
                                            isDialogOpen &&
                                            selectedClient?.clientId ===
                                              c.clientId
                                          } // Use clientId aqui
                                          onOpenChange={(open) => {
                                            setIsDialogOpen(open);
                                            if (!open) setSelectedClient(null);
                                          }}
                                        >
                                          <DialogTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="gap-2 opacity-70 group-hover:opacity-100 transition-opacity"
                                              onClick={() =>
                                                setSelectedClient(c)
                                              }
                                            >
                                              <Ticket className="h-4 w-4" />
                                              Atribuir Cupom
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] flex flex-col p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                            {/* Header Fixo */}
                                            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0 border-b">
                                              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                                                <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-[hsl(var(--product-pink))]" />
                                                Atribuir Cupom
                                              </DialogTitle>
                                              <DialogDescription className="text-xs sm:text-sm">
                                                Crie um cupom exclusivo para{" "}
                                                <strong>
                                                  {selectedClient?.clientName}
                                                </strong>
                                              </DialogDescription>
                                            </DialogHeader>

                                            {/* Conteúdo com Scroll */}
                                            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                              <div className="space-y-3 sm:space-y-4">
                                                {/* Código do Cupom */}
                                                <div className="space-y-2">
                                                  <Label
                                                    htmlFor="code"
                                                    className="text-sm"
                                                  >
                                                    Código do Cupom *
                                                  </Label>
                                                  <div className="flex flex-col sm:flex-row gap-2">
                                                    <Input
                                                      id="code"
                                                      placeholder="Ex: VIP20"
                                                      value={couponForm.code}
                                                      onChange={(e) =>
                                                        setCouponForm(
                                                          (prev) => ({
                                                            ...prev,
                                                            code: e.target.value.toUpperCase(),
                                                          })
                                                        )
                                                      }
                                                      className="uppercase text-sm flex-1"
                                                      maxLength={20}
                                                    />
                                                    <Button
                                                      type="button"
                                                      variant="secondary"
                                                      onClick={
                                                        generateCouponCode
                                                      }
                                                      className="text-sm whitespace-nowrap"
                                                    >
                                                      Gerar
                                                    </Button>
                                                  </div>
                                                </div>

                                                {/* Desconto e Tipo */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                  <div className="space-y-2">
                                                    <Label
                                                      htmlFor="discount"
                                                      className="text-sm"
                                                    >
                                                      Desconto *
                                                    </Label>
                                                    <Input
                                                      id="discount"
                                                      type="number"
                                                      step="0.01"
                                                      min="0"
                                                      placeholder="10"
                                                      value={
                                                        couponForm.discount
                                                      }
                                                      onChange={(e) =>
                                                        setCouponForm(
                                                          (prev) => ({
                                                            ...prev,
                                                            discount:
                                                              e.target.value,
                                                          })
                                                        )
                                                      }
                                                      className="text-sm"
                                                    />
                                                  </div>
                                                  <div className="space-y-2">
                                                    <Label className="text-sm">
                                                      Tipo *
                                                    </Label>
                                                    <Select
                                                      value={couponForm.type}
                                                      onValueChange={(
                                                        value:
                                                          | "percentage"
                                                          | "fixed"
                                                      ) =>
                                                        setCouponForm(
                                                          (prev) => ({
                                                            ...prev,
                                                            type: value,
                                                          })
                                                        )
                                                      }
                                                    >
                                                      <SelectTrigger className="text-sm">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="percentage">
                                                          Percentual (%)
                                                        </SelectItem>
                                                        <SelectItem value="fixed">
                                                          Valor Fixo (MZN)
                                                        </SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                </div>

                                                {/* Data de Expiração e Limite de Uso */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                  <div className="space-y-2">
                                                    <Label
                                                      htmlFor="expiresAt"
                                                      className="text-sm"
                                                    >
                                                      Expira em *
                                                    </Label>
                                                    <Input
                                                      id="expiresAt"
                                                      type="date"
                                                      min={getMinDate()}
                                                      value={
                                                        couponForm.expiresAt
                                                      }
                                                      onChange={(e) =>
                                                        setCouponForm(
                                                          (prev) => ({
                                                            ...prev,
                                                            expiresAt:
                                                              e.target.value,
                                                          })
                                                        )
                                                      }
                                                      className="text-sm"
                                                    />
                                                  </div>
                                                  <div className="space-y-2">
                                                    <Label
                                                      htmlFor="usageLimit"
                                                      className="text-sm"
                                                    >
                                                      Limite de uso *
                                                    </Label>
                                                    <Input
                                                      id="usageLimit"
                                                      type="number"
                                                      min="1"
                                                      placeholder="1"
                                                      value={
                                                        couponForm.usageLimit
                                                      }
                                                      onChange={(e) =>
                                                        setCouponForm(
                                                          (prev) => ({
                                                            ...prev,
                                                            usageLimit:
                                                              e.target.value,
                                                          })
                                                        )
                                                      }
                                                      className="text-sm"
                                                    />
                                                  </div>
                                                </div>

                                                {/* Valor Mínimo de Compra */}
                                                <div className="space-y-2">
                                                  <Label
                                                    htmlFor="minPurchase"
                                                    className="text-sm"
                                                  >
                                                    Valor mínimo de compra
                                                    (opcional)
                                                  </Label>
                                                  <Input
                                                    id="minPurchase"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="100.00"
                                                    value={
                                                      couponForm.minPurchaseAmount
                                                    }
                                                    onChange={(e) =>
                                                      setCouponForm((prev) => ({
                                                        ...prev,
                                                        minPurchaseAmount:
                                                          e.target.value,
                                                      }))
                                                    }
                                                    className="text-sm"
                                                  />
                                                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                    Valor mínimo do carrinho
                                                    para usar o cupom
                                                  </p>
                                                </div>

                                                {/* Desconto Máximo (apenas para percentual) */}
                                                {couponForm.type ===
                                                  "percentage" && (
                                                  <div className="space-y-2">
                                                    <Label
                                                      htmlFor="maxDiscount"
                                                      className="text-sm"
                                                    >
                                                      Desconto máximo (opcional)
                                                    </Label>
                                                    <Input
                                                      id="maxDiscount"
                                                      type="number"
                                                      step="0.01"
                                                      min="0"
                                                      placeholder="50.00"
                                                      value={
                                                        couponForm.maxDiscountAmount
                                                      }
                                                      onChange={(e) =>
                                                        setCouponForm(
                                                          (prev) => ({
                                                            ...prev,
                                                            maxDiscountAmount:
                                                              e.target.value,
                                                          })
                                                        )
                                                      }
                                                      className="text-sm"
                                                    />
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                      Valor máximo de desconto
                                                      em MZN
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Preview do Cupom */}
                                                {couponForm.code &&
                                                  couponForm.discount &&
                                                  couponForm.expiresAt && (
                                                    <div className="p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border">
                                                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                                                        Prévia do cupom:
                                                      </p>
                                                      <div className="space-y-1">
                                                        <p className="font-bold text-base sm:text-lg break-words">
                                                          {couponForm.code} →{" "}
                                                          {couponForm.discount}
                                                          {couponForm.type ===
                                                          "percentage"
                                                            ? "% OFF"
                                                            : " MZN OFF"}
                                                        </p>
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                          Válido até:{" "}
                                                          {new Date(
                                                            couponForm.expiresAt
                                                          ).toLocaleDateString(
                                                            "pt-BR"
                                                          )}
                                                        </p>
                                                        {couponForm.minPurchaseAmount && (
                                                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                            Compra mínima:{" "}
                                                            {
                                                              couponForm.minPurchaseAmount
                                                            }{" "}
                                                            MZN
                                                          </p>
                                                        )}
                                                        {couponForm.maxDiscountAmount &&
                                                          couponForm.type ===
                                                            "percentage" && (
                                                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                              Desconto máximo:{" "}
                                                              {
                                                                couponForm.maxDiscountAmount
                                                              }{" "}
                                                              MZN
                                                            </p>
                                                          )}
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                          Usos permitidos:{" "}
                                                          {
                                                            couponForm.usageLimit
                                                          }
                                                        </p>
                                                      </div>
                                                    </div>
                                                  )}
                                              </div>
                                            </div>

                                            {/* Footer Fixo */}
                                            <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 flex-shrink-0 border-t flex-col sm:flex-row gap-2">
                                              <Button
                                                variant="outline"
                                                onClick={() => {
                                                  setIsDialogOpen(false);
                                                  setSelectedClient(null);
                                                  setCouponForm({
                                                    code: "",
                                                    discount: "",
                                                    type: "percentage",
                                                    expiresAt: "",
                                                    minPurchaseAmount: "",
                                                    maxDiscountAmount: "",
                                                    usageLimit: "1",
                                                    assignedTo: "",
                                                  });
                                                }}
                                                disabled={couponLoading}
                                                className="w-full sm:w-auto text-sm"
                                              >
                                                Cancelar
                                              </Button>
                                              <Button
                                                onClick={handleAssignCoupon}
                                                className="gap-2 w-full sm:w-auto text-sm"
                                                disabled={couponLoading}
                                              >
                                                {couponLoading ? (
                                                  <>
                                                    <span className="animate-spin">
                                                      ⏳
                                                    </span>
                                                    Criando...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    Atribuir Cupom
                                                  </>
                                                )}
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                : customersFromApi
                                    .sort((a, b) => b.totalSpent - a.totalSpent)
                                    .slice(0, 5)
                                    .map((customer, idx) => (
                                      <TableRow
                                        key={customer.id || `customer-${idx}`}
                                      >
                                        <TableCell className="font-medium">
                                          {customer.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {customer.totalOrders}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-accent">
                                          {customer.totalSpent} MZN
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {new Date(
                                            customer.lastOrder
                                          ).toLocaleDateString("pt-BR")}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Products */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg sm:text-xl">
                        Produtos Mais Comprados
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Top 5 produtos com maior volume de vendas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="overflow-x-auto">
                        {reportLoading ? (
                          <div className="space-y-4">
                            {[...Array(5)].map((_, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4"
                              >
                                <Skeleton className="h-16 w-16 rounded-md" />
                                <Skeleton className="h-12 flex-1" />
                                <Skeleton className="h-12 w-24" />
                                <Skeleton className="h-12 w-28" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">
                                  Quantidade Vendida
                                </TableHead>
                                <TableHead className="text-right">
                                  Receita Total
                                </TableHead>
                                <TableHead className="text-right">
                                  Pedidos
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {topProducts && topProducts.length > 0 ? (
                                topProducts.map((product, idx) => (
                                  <TableRow
                                    key={
                                      product.productId || `topProduct-${idx}`
                                    }
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={`${productionUrl}/img/products/${product.productImage}`}
                                          alt={product.productName}
                                          className="h-12 w-12 object-cover rounded-md"
                                          onError={(e) => {
                                            e.currentTarget.src =
                                              "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
                                          }}
                                        />
                                        <div>
                                          <p className="font-medium">
                                            {product.productName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {product.category}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                      {product.totalQuantity}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-accent">
                                      {product.totalRevenue.toFixed(2)} MZN
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {product.orderCount}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    className="text-center text-muted-foreground"
                                  >
                                    Nenhum produto encontrado
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Least Sold Products */}
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg sm:text-xl">
                        Produtos Menos Comprados
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Produtos com menor volume de vendas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="overflow-x-auto">
                        {reportLoading ? (
                          <div className="space-y-4">
                            {[...Array(5)].map((_, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-4"
                              >
                                <Skeleton className="h-16 w-16 rounded-md" />
                                <Skeleton className="h-12 flex-1" />
                                <Skeleton className="h-12 w-24" />
                                <Skeleton className="h-12 w-28" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">
                                  Quantidade Vendida
                                </TableHead>
                                <TableHead className="text-right">
                                  Receita Total
                                </TableHead>
                                <TableHead className="text-right">
                                  Pedidos
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {leastSoldProducts &&
                              leastSoldProducts.length > 0 ? (
                                leastSoldProducts.map((product, idx) => (
                                  <TableRow
                                    key={
                                      product.productId || `leastProduct-${idx}`
                                    }
                                  >
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={`${productionUrl}/img/products/${product.productImage}`}
                                          alt={product.productName}
                                          className="h-12 w-12 object-cover rounded-md"
                                          onError={(e) => {
                                            e.currentTarget.src =
                                              "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
                                          }}
                                        />
                                        <div>
                                          <p className="font-medium">
                                            {product.productName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {product.category}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                      {product.totalQuantity}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-accent">
                                      {product.totalRevenue.toFixed(2)} MZN
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {product.orderCount}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    className="text-center text-muted-foreground"
                                  >
                                    Nenhum produto encontrado
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {/* Products Tab */}
            <TabsContent value="products" className="mt-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">
                        Produtos Cadastrados
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {filteredProducts.length} produtos no catálogo
                      </CardDescription>
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {paginatedProducts.map((product) => {
                      // Verificar se o produto está fora de estoque
                      const hasVariants =
                        (product.variants && product.variants.length > 0) ||
                        (product.variations && product.variations.length > 0) ||
                        (product.colors && product.colors.length > 0);

                      let isOutOfStock = false;
                      let totalStock = 0;

                      if (!hasVariants) {
                        // Produto sem variantes: verificar stock direto
                        isOutOfStock = (product.stock || 0) <= 0;
                        totalStock = product.stock || 0;
                      } else {
                        // Produto com variantes: verificar se todas as variantes estão fora de estoque
                        const variants =
                          product.variants || product.variations || [];
                        const totalVariantStock = variants.reduce(
                          (sum: number, v: any) => sum + (v.stock || 0),
                          0
                        );
                        totalStock = totalVariantStock;
                        isOutOfStock = totalVariantStock <= 0;
                      }

                      return (
                        <div
                          key={product._id}
                          className={`flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg transition-colors ${
                            isOutOfStock
                              ? "border-destructive/50 bg-destructive/5 hover:border-destructive"
                              : "border-border hover:border-accent"
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={`${productionUrl}/img/products/${product.imageCover}`}
                              alt={product.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
                              }}
                            />
                            {isOutOfStock && (
                              <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm sm:text-base text-foreground break-words">
                                    {product.name}
                                  </h3>
                                  {isOutOfStock && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs flex items-center gap-1"
                                    >
                                      <AlertTriangle className="h-3 w-3" />
                                      Fora de Estoque
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {product.category} • {product.gender}
                                </p>
                                <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                                  {product.priceDiscount &&
                                  product.priceDiscount > 0 ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm sm:text-base text-muted-foreground line-through">
                                        {product.price.toFixed(2)} MZN
                                      </p>
                                      <p className="text-base sm:text-lg font-bold text-accent">
                                        {product.priceDiscount.toFixed(2)} MZN
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-base sm:text-lg font-bold text-accent">
                                      {product.price.toFixed(2)} MZN
                                    </p>
                                  )}
                                  {/* Mostrar estoque sempre, com destaque se fora de estoque */}
                                  <Badge
                                    variant={
                                      totalStock > 0 ? "default" : "destructive"
                                    }
                                    className={`text-xs flex items-center gap-1 ${
                                      isOutOfStock ? "font-semibold" : ""
                                    }`}
                                  >
                                    {hasVariants ? (
                                      <>
                                        <Package className="h-3 w-3" />
                                        Estoque Total: {totalStock}
                                      </>
                                    ) : (
                                      <>Estoque: {totalStock}</>
                                    )}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditProduct(product)}
                                  className="h-8 w-8 sm:h-10 sm:w-10"
                                >
                                  <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDeleteProduct(product)}
                                  className="h-8 w-8 sm:h-10 sm:w-10"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        Nenhum produto encontrado
                      </div>
                    )}
                  </div>

                  {/* Pagination for Products */}
                  {filteredProducts.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4">
                      <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                        Mostrando {(productsPage - 1) * itemsPerPage + 1} a{" "}
                        {Math.min(
                          productsPage * itemsPerPage,
                          filteredProducts.length
                        )}{" "}
                        de {filteredProducts.length} produtos
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setProductsPage((p) => Math.max(1, p - 1))
                          }
                          disabled={productsPage === 1}
                          className="text-xs sm:text-sm"
                        >
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1 overflow-x-auto">
                          {Array.from(
                            { length: totalProductsPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <Button
                              key={page}
                              variant={
                                page === productsPage ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setProductsPage(page)}
                              className="w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setProductsPage((p) =>
                              Math.min(totalProductsPages, p + 1)
                            )
                          }
                          disabled={productsPage === totalProductsPages}
                          className="text-xs sm:text-sm"
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Variants Tab */}
            <TabsContent value="variants" className="mt-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">
                        Gestão de Variantes
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {allVariants.length} variante
                        {allVariants.length !== 1 ? "s" : ""} cadastrada
                        {allVariants.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar variantes..."
                          value={variantSearchTerm}
                          onChange={(e) => setVariantSearchTerm(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setIsProductSelectModalOpen(true)}
                        className="w-full sm:w-64 text-sm justify-start"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {variantProductFilter === "all"
                          ? "Filtrar por produto"
                          : products.find((p) => p._id === variantProductFilter)
                              ?.name || "Filtrar por produto"}
                      </Button>
                      <Button
                        onClick={() => {
                          resetVariantFormState();
                          setSelectedProductForVariant("");
                          setIsVariantDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Nova Variante</span>
                        <span className="sm:hidden">Nova</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {variantLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando variantes...
                    </div>
                  ) : variantError ? (
                    <div className="text-center py-8 text-destructive">
                      {variantError}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 sm:space-y-4">
                        {(() => {
                          // Filtrar variantes por produto e termo de busca
                          const filteredVariants = allVariants.filter(
                            (variant) => {
                              // Filtro por produto
                              if (variantProductFilter !== "all") {
                                const productId =
                                  typeof variant.product === "object" &&
                                  variant.product !== null
                                    ? (variant.product as any)?._id ||
                                      (variant.product as any)?.id
                                    : variant.product;
                                if (productId !== variantProductFilter) {
                                  return false;
                                }
                              }

                              // Filtro por termo de busca
                              if (!variantSearchTerm) return true;
                              const searchLower =
                                variantSearchTerm.toLowerCase();
                              // Lidar com produto como string ou objeto populado
                              const productId =
                                typeof variant.product === "object" &&
                                variant.product !== null
                                  ? (variant.product as any)?._id ||
                                    (variant.product as any)?.id
                                  : variant.product;
                              const product = products.find(
                                (p) => p._id === productId || p.id === productId
                              );
                              const productName =
                                product?.name ||
                                (typeof variant.product === "object" &&
                                variant.product !== null
                                  ? (variant.product as any)?.name
                                  : "");
                              return (
                                variant.sku
                                  ?.toLowerCase()
                                  .includes(searchLower) ||
                                variant.color
                                  ?.toLowerCase()
                                  .includes(searchLower) ||
                                variant.size
                                  ?.toLowerCase()
                                  .includes(searchLower) ||
                                productName.toLowerCase().includes(searchLower)
                              );
                            }
                          );

                          // Paginação
                          const totalVariantsPages = Math.ceil(
                            filteredVariants.length / itemsPerPage
                          );
                          const startIndex = (variantsPage - 1) * itemsPerPage;
                          const endIndex = startIndex + itemsPerPage;
                          const paginatedVariants = filteredVariants.slice(
                            startIndex,
                            endIndex
                          );

                          return (
                            <>
                              {paginatedVariants.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                  {variantSearchTerm
                                    ? "Nenhuma variante encontrada"
                                    : "Nenhuma variante cadastrada"}
                                </div>
                              ) : (
                                paginatedVariants.map((variant) => {
                                  // Lidar com produto como string ou objeto populado
                                  const productId =
                                    typeof variant.product === "object" &&
                                    variant.product !== null
                                      ? (variant.product as any)?._id ||
                                        (variant.product as any)?.id
                                      : variant.product;
                                  const product = products.find(
                                    (p) =>
                                      p._id === productId || p.id === productId
                                  );
                                  const productName =
                                    product?.name ||
                                    (typeof variant.product === "object" &&
                                    variant.product !== null
                                      ? (variant.product as any)?.name
                                      : "Produto não encontrado");

                                  const isVariantOutOfStock =
                                    (variant.stock || 0) <= 0;

                                  return (
                                    <div
                                      key={variant._id}
                                      className={`flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg transition-colors ${
                                        isVariantOutOfStock
                                          ? "border-destructive/50 bg-destructive/5 hover:border-destructive"
                                          : "border-border hover:border-accent"
                                      }`}
                                    >
                                      <div className="relative flex-shrink-0">
                                        {variant.image ? (
                                          <img
                                            src={`${productionUrl}/img/variants/${variant.image}`}
                                            alt={variant.sku}
                                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md"
                                            onError={(e) => {
                                              e.currentTarget.src =
                                                "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
                                            }}
                                          />
                                        ) : (
                                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-md flex items-center justify-center">
                                            <Package className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                                          </div>
                                        )}
                                        {isVariantOutOfStock && (
                                          <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              {(() => {
                                                const col = variant.color || "";
                                                const name =
                                                  hexToColorName(col);
                                                const label = name
                                                  ? name
                                                  : col
                                                      .replace("#", "")
                                                      .toUpperCase();
                                                return (
                                                  <h3 className="font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
                                                    <span
                                                      className="w-3 h-3 rounded-full border"
                                                      style={{
                                                        backgroundColor: col,
                                                      }}
                                                      aria-hidden
                                                    />
                                                    <span className="text-muted-foreground">
                                                      •
                                                    </span>
                                                    <span>{variant.size}</span>
                                                  </h3>
                                                );
                                              })()}
                                              {isVariantOutOfStock && (
                                                <Badge
                                                  variant="destructive"
                                                  className="text-xs flex items-center gap-1"
                                                >
                                                  <AlertTriangle className="h-3 w-3" />
                                                  Fora de Estoque
                                                </Badge>
                                              )}
                                            </div>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                              SKU: {variant.sku}
                                            </p>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                              Produto:{" "}
                                              <span className="font-medium">
                                                {productName}
                                              </span>
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant={
                                                variant.stock &&
                                                variant.stock > 0
                                                  ? "default"
                                                  : "destructive"
                                              }
                                              className={`text-xs flex items-center gap-1 ${
                                                isVariantOutOfStock
                                                  ? "font-semibold"
                                                  : ""
                                              }`}
                                            >
                                              <Package className="h-3 w-3" />
                                              Estoque: {variant.stock || 0}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleEditVariant(variant)
                                            }
                                            className="text-xs sm:text-sm"
                                          >
                                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                            Editar
                                          </Button>
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                              handleDeleteVariant(variant)
                                            }
                                            className="text-xs sm:text-sm"
                                          >
                                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                            Eliminar
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}

                              {/* Pagination for Variants */}
                              {filteredVariants.length > itemsPerPage && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4">
                                  <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                    Mostrando{" "}
                                    {(variantsPage - 1) * itemsPerPage + 1} a{" "}
                                    {Math.min(
                                      variantsPage * itemsPerPage,
                                      filteredVariants.length
                                    )}{" "}
                                    de {filteredVariants.length} variantes
                                  </p>
                                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setVariantsPage((p) =>
                                          Math.max(1, p - 1)
                                        )
                                      }
                                      disabled={variantsPage === 1}
                                      className="text-xs sm:text-sm"
                                    >
                                      Anterior
                                    </Button>
                                    <div className="flex items-center gap-1 overflow-x-auto">
                                      {Array.from(
                                        { length: totalVariantsPages },
                                        (_, i) => i + 1
                                      ).map((page) => (
                                        <Button
                                          key={page}
                                          variant={
                                            page === variantsPage
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          onClick={() => setVariantsPage(page)}
                                          className="w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm"
                                        >
                                          {page}
                                        </Button>
                                      ))}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setVariantsPage((p) =>
                                          Math.min(totalVariantsPages, p + 1)
                                        )
                                      }
                                      disabled={
                                        variantsPage === totalVariantsPages
                                      }
                                      className="text-xs sm:text-sm"
                                    >
                                      Próxima
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">
                        Comentários dos Clientes
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {reviews.length} comentário
                        {reviews.length !== 1 ? "s" : ""} no total
                      </CardDescription>
                    </div>
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar comentários..."
                        value={reviewSearchTerm}
                        onChange={(e) => setReviewSearchTerm(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {reviewsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando comentários...
                    </div>
                  ) : reviewsError ? (
                    <div className="text-center py-8 text-destructive">
                      {reviewsError}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 sm:space-y-4">
                        {(() => {
                          // Filtrar reviews por termo de busca
                          const filteredReviews = reviews.filter((review) => {
                            if (!reviewSearchTerm) return true;
                            const searchLower = reviewSearchTerm.toLowerCase();
                            const userName =
                              typeof review.user === "object"
                                ? review.user?.name || ""
                                : "";
                            const reviewText =
                              review.review?.toLowerCase() || "";
                            const productName =
                              products.find((p) => p._id === review.product)
                                ?.name || "";
                            return (
                              userName.toLowerCase().includes(searchLower) ||
                              reviewText.includes(searchLower) ||
                              productName.toLowerCase().includes(searchLower)
                            );
                          });

                          // Paginação
                          const totalReviewsPages = Math.ceil(
                            filteredReviews.length / itemsPerPage
                          );
                          const startIndex = (reviewsPage - 1) * itemsPerPage;
                          const endIndex = startIndex + itemsPerPage;
                          const paginatedReviews = filteredReviews.slice(
                            startIndex,
                            endIndex
                          );

                          return (
                            <>
                              {paginatedReviews.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                  {reviewSearchTerm
                                    ? "Nenhum comentário encontrado"
                                    : "Nenhum comentário ainda"}
                                </div>
                              ) : (
                                paginatedReviews.map((review) => {
                                  const user =
                                    typeof review.user === "object"
                                      ? review.user
                                      : null;
                                  const userName =
                                    user?.name || "Usuário Anônimo";
                                  const userPhoto = user?.photo;
                                  const product = products.find(
                                    (p) => p._id === review.product
                                  );
                                  const productName =
                                    product?.name || "Produto não encontrado";

                                  return (
                                    <div
                                      key={review._id}
                                      className="flex gap-3 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg hover:border-accent transition-colors"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                                                {userName}
                                              </h3>
                                              <div className="flex items-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                  <Star
                                                    key={i}
                                                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                                      i < review.rating
                                                        ? "fill-accent text-accent"
                                                        : "text-muted"
                                                    }`}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                                              Produto:{" "}
                                              <span className="font-medium">
                                                {productName}
                                              </span>
                                            </p>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                              {new Date(
                                                review.createdAt
                                              ).toLocaleDateString("pt-BR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </p>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                              setConfirmDialog({
                                                open: true,
                                                action: "deleteReview",
                                                reviewId: review._id,
                                                name: userName,
                                                reviewText:
                                                  review.review?.substring(
                                                    0,
                                                    50
                                                  ) +
                                                  (review.review &&
                                                  review.review.length > 50
                                                    ? "..."
                                                    : ""),
                                              });
                                            }}
                                            className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                                          >
                                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                          </Button>
                                        </div>
                                        <p className="text-sm sm:text-base text-foreground leading-relaxed">
                                          {review.review}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}

                              {/* Pagination for Reviews */}
                              {filteredReviews.length > itemsPerPage && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4">
                                  <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                    Mostrando{" "}
                                    {(reviewsPage - 1) * itemsPerPage + 1} a{" "}
                                    {Math.min(
                                      reviewsPage * itemsPerPage,
                                      filteredReviews.length
                                    )}{" "}
                                    de {filteredReviews.length} comentários
                                  </p>
                                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setReviewsPage((p) =>
                                          Math.max(1, p - 1)
                                        )
                                      }
                                      disabled={reviewsPage === 1}
                                      className="text-xs sm:text-sm"
                                    >
                                      Anterior
                                    </Button>
                                    <div className="flex items-center gap-1 overflow-x-auto">
                                      {Array.from(
                                        { length: totalReviewsPages },
                                        (_, i) => i + 1
                                      ).map((page) => (
                                        <Button
                                          key={page}
                                          variant={
                                            page === reviewsPage
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          onClick={() => setReviewsPage(page)}
                                          className="w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm"
                                        >
                                          {page}
                                        </Button>
                                      ))}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setReviewsPage((p) =>
                                          Math.min(totalReviewsPages, p + 1)
                                        )
                                      }
                                      disabled={
                                        reviewsPage === totalReviewsPages
                                      }
                                      className="text-xs sm:text-sm"
                                    >
                                      Próxima
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Coupons Tab - Apenas para admin */}
            {!isManager && (
              <TabsContent value="coupons" className="mt-6">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">
                          Gestão de Cupons
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {apiCoupons.length} cupom
                          {apiCoupons.length !== 1 ? "s" : ""} cadastrado
                          {apiCoupons.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1 sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar cupons..."
                            value={couponSearchTerm}
                            onChange={(e) =>
                              setCouponSearchTerm(e.target.value)
                            }
                            className="pl-10 text-sm"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            setCouponForm({
                              code: "",
                              discount: "",
                              type: "percentage",
                              expiresAt: "",
                              minPurchaseAmount: "",
                              maxDiscountAmount: "",
                              usageLimit: "1",
                              assignedTo: "",
                            });
                            setEditingCoupon(null);
                            setIsCreateCouponDialogOpen(true);
                          }}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:inline">Novo Cupom</span>
                          <span className="sm:hidden">Novo</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {couponLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Carregando cupons...
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">
                                  Desconto
                                </TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Válido até</TableHead>
                                <TableHead className="text-right">
                                  Usos
                                </TableHead>
                                <TableHead className="text-right">
                                  Ações
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                // Filtrar cupons por termo de busca
                                const filteredCoupons = apiCoupons.filter(
                                  (coupon) => {
                                    if (!couponSearchTerm) return true;
                                    const searchLower =
                                      couponSearchTerm.toLowerCase();
                                    return (
                                      coupon.code
                                        .toLowerCase()
                                        .includes(searchLower) ||
                                      coupon.type
                                        .toLowerCase()
                                        .includes(searchLower)
                                    );
                                  }
                                );

                                // Paginação
                                const totalCouponsPages = Math.ceil(
                                  filteredCoupons.length / itemsPerPage
                                );
                                const startIndex =
                                  (couponsPage - 1) * itemsPerPage;
                                const endIndex = startIndex + itemsPerPage;
                                const paginatedCoupons = filteredCoupons.slice(
                                  startIndex,
                                  endIndex
                                );

                                return (
                                  <>
                                    {paginatedCoupons.length === 0 ? (
                                      <TableRow>
                                        <TableCell
                                          colSpan={8}
                                          className="text-center text-muted-foreground py-8"
                                        >
                                          {couponSearchTerm
                                            ? "Nenhum cupom encontrado"
                                            : "Nenhum cupom cadastrado"}
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      paginatedCoupons.map((coupon) => {
                                        const isExpired =
                                          new Date(coupon.expiresAt) <
                                          new Date();
                                        const isUsed = !!coupon.usedAt;
                                        const isActive =
                                          coupon.isActive && !isExpired;

                                        return (
                                          <TableRow key={coupon._id}>
                                            <TableCell className="font-medium">
                                              <div className="flex items-center gap-2">
                                                <span>{coupon.code}</span>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-6 w-6"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(
                                                      coupon.code
                                                    );
                                                    toast({
                                                      title: "Copiado!",
                                                      description: `Código ${coupon.code} copiado`,
                                                    });
                                                  }}
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <Badge variant="outline">
                                                {coupon.type === "percentage"
                                                  ? "Percentual"
                                                  : "Fixo"}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                              {coupon.discount}
                                              {coupon.type === "percentage"
                                                ? "%"
                                                : " MZN"}
                                            </TableCell>
                                            <TableCell>
                                              {coupon.assignedTo ? (
                                                (() => {
                                                  const assignedUser =
                                                    users.find(
                                                      (u) =>
                                                        u._id ===
                                                          coupon.assignedTo ||
                                                        u.userId ===
                                                          coupon.assignedTo
                                                    );
                                                  return assignedUser ? (
                                                    <span className="text-xs sm:text-sm">
                                                      {assignedUser.name}
                                                    </span>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                      ID:{" "}
                                                      {coupon.assignedTo?.slice(
                                                        -8
                                                      )}
                                                    </span>
                                                  );
                                                })()
                                              ) : (
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  Público
                                                </Badge>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <Badge
                                                variant={
                                                  isActive
                                                    ? "default"
                                                    : isUsed
                                                    ? "secondary"
                                                    : isExpired
                                                    ? "destructive"
                                                    : "outline"
                                                }
                                              >
                                                {isActive
                                                  ? "Ativo"
                                                  : isUsed
                                                  ? "Usado"
                                                  : isExpired
                                                  ? "Expirado"
                                                  : "Inativo"}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>
                                              {new Date(
                                                coupon.expiresAt
                                              ).toLocaleDateString("pt-BR")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {coupon.usageCount || 0} /{" "}
                                              {coupon.usageLimit || 1}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex items-center justify-end gap-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    setEditingCoupon(coupon);
                                                    setCouponForm({
                                                      code: coupon.code,
                                                      discount: String(
                                                        coupon.discount
                                                      ),
                                                      type: coupon.type,
                                                      expiresAt: new Date(
                                                        coupon.expiresAt
                                                      )
                                                        .toISOString()
                                                        .split("T")[0],
                                                      minPurchaseAmount:
                                                        coupon.minPurchaseAmount
                                                          ? String(
                                                              coupon.minPurchaseAmount
                                                            )
                                                          : "",
                                                      maxDiscountAmount:
                                                        coupon.maxDiscountAmount
                                                          ? String(
                                                              coupon.maxDiscountAmount
                                                            )
                                                          : "",
                                                      usageLimit: String(
                                                        coupon.usageLimit || 1
                                                      ),
                                                      assignedTo:
                                                        coupon.assignedTo || "",
                                                    });
                                                    setIsEditCouponDialogOpen(
                                                      true
                                                    );
                                                  }}
                                                  className="gap-1"
                                                >
                                                  <Pencil className="h-3 w-3" />
                                                  <span className="hidden sm:inline">
                                                    Editar
                                                  </span>
                                                </Button>
                                                <Button
                                                  variant="destructive"
                                                  size="sm"
                                                  onClick={() => {
                                                    setConfirmDialog({
                                                      open: true,
                                                      action: "deleteCoupon",
                                                      id: coupon._id,
                                                      name: coupon.code,
                                                    });
                                                  }}
                                                  className="gap-1"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                  <span className="hidden sm:inline">
                                                    Excluir
                                                  </span>
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })
                                    )}
                                  </>
                                );
                              })()}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {(() => {
                          const filteredCoupons = apiCoupons.filter(
                            (coupon) => {
                              if (!couponSearchTerm) return true;
                              const searchLower =
                                couponSearchTerm.toLowerCase();
                              return (
                                coupon.code
                                  .toLowerCase()
                                  .includes(searchLower) ||
                                coupon.type.toLowerCase().includes(searchLower)
                              );
                            }
                          );
                          const totalCouponsPages = Math.ceil(
                            filteredCoupons.length / itemsPerPage
                          );

                          return (
                            totalCouponsPages > 1 && (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4">
                                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                  Mostrando{" "}
                                  {(couponsPage - 1) * itemsPerPage + 1} a{" "}
                                  {Math.min(
                                    couponsPage * itemsPerPage,
                                    filteredCoupons.length
                                  )}{" "}
                                  de {filteredCoupons.length} cupons
                                </p>
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setCouponsPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={couponsPage === 1}
                                    className="text-xs sm:text-sm"
                                  >
                                    Anterior
                                  </Button>
                                  <div className="flex items-center gap-1 overflow-x-auto">
                                    {Array.from(
                                      { length: totalCouponsPages },
                                      (_, i) => i + 1
                                    ).map((page) => (
                                      <Button
                                        key={page}
                                        variant={
                                          page === couponsPage
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        onClick={() => setCouponsPage(page)}
                                        className="w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm"
                                      >
                                        {page}
                                      </Button>
                                    ))}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setCouponsPage((p) =>
                                        Math.min(totalCouponsPages, p + 1)
                                      )
                                    }
                                    disabled={couponsPage === totalCouponsPages}
                                    className="text-xs sm:text-sm"
                                  >
                                    Próxima
                                  </Button>
                                </div>
                              </div>
                            )
                          );
                        })()}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Add Product Tab */}
            <TabsContent value="add-product" className="mt-6">
              <Card>
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-xl sm:text-2xl">
                    Cadastrar Novo Produto
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Adicione um novo produto ao catálogo
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <form
                    ref={productFormRef}
                    onSubmit={handleAddProduct}
                    className="space-y-4 sm:space-y-6"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Nome do Produto *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Ex: Camiseta Premium"
                          className="text-sm"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-sm font-medium">
                          Preço (MZN) *
                        </Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock" className="text-sm font-medium">
                        Estoque Inicial *
                      </Label>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        defaultValue="0"
                        className="text-sm"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Quantidade inicial em estoque (para produtos sem
                        variantes)
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="category"
                          className="text-sm font-medium"
                        >
                          Categoria *
                        </Label>
                        <Select name="category" required>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Camisetas">Camisetas</SelectItem>
                            <SelectItem value="Vestidos">Vestidos</SelectItem>
                            <SelectItem value="Casacos">Casacos</SelectItem>
                            <SelectItem value="Calças">Calças</SelectItem>
                            <SelectItem value="Blazers">Blazers</SelectItem>
                            <SelectItem value="Carteiras">Carteiras</SelectItem>
                            <SelectItem value="Calçados">Calçados</SelectItem>
                            <SelectItem value="Jaquetas">Jaquetas</SelectItem>
                            <SelectItem value="Saias">Saias</SelectItem>
                            <SelectItem value="Moletons">Moletons</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sm font-medium">
                          Gênero *
                        </Label>
                        <Select name="gender" required>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Selecione o gênero" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                            <SelectItem value="Unissex">Unissex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        Descrição *
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Descreva o produto..."
                        rows={4}
                        className="text-sm resize-none"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Imagem Principal do Produto *
                      </Label>
                      {!productImage ? (
                        <div className="flex-1">
                          <label className="flex flex-col items-center justify-center w-full h-40 sm:h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors bg-muted/30">
                            <div className="flex flex-col items-center justify-center pt-6 sm:pt-8 pb-6 sm:pb-8">
                              <Upload className="w-8 h-8 sm:w-10 sm:h-10 mb-3 text-muted-foreground" />
                              <p className="text-sm sm:text-base text-muted-foreground text-center px-4 font-medium">
                                Clique para fazer upload da imagem
                              </p>
                              <p className="text-xs text-muted-foreground/70 text-center px-4 mt-1">
                                PNG, JPG ou JPEG até 5MB
                              </p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="relative w-full">
                          <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden border-2 border-border bg-muted/20">
                            <img
                              src={productImage}
                              alt="Preview da imagem do produto"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-3 right-3 h-9 w-9 shadow-lg"
                              onClick={() => {
                                setProductImage("");
                                setProductImageFile(null);
                              }}
                              title="Remover imagem"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <div className="absolute bottom-3 left-3 right-3 opacity-0 hover:opacity-100 transition-opacity">
                              <label className="block cursor-pointer">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  id="replace-image-input"
                                />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="w-full shadow-lg"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const input = document.getElementById(
                                      "replace-image-input"
                                    ) as HTMLInputElement;
                                    input?.click();
                                  }}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Trocar imagem
                                </Button>
                              </label>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Imagem selecionada. Clique em "Trocar imagem" para
                            substituir.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Cadastrar Produto
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={handleClearForm}
                      >
                        Limpar Formulário
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setOrderDetailsPage(1);
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              Detalhes do Pedido #{selectedOrder?.slice(-8)}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Confira os produtos do seu pedido
            </DialogDescription>
          </DialogHeader>

          {selectedOrder &&
            (() => {
              let order: OrderViewShape | null = null;
              if (
                currentOrder &&
                (currentOrder._id || currentOrder.id) === selectedOrder
              ) {
                order = mapOrderToView(currentOrder);
              } else {
                order = allOrders.find((o) => o.id === selectedOrder);
              }
              if (!order || !order.products) return null;

              const totalProductPages = Math.ceil(
                order.products.length / orderDetailsItemsPerPage || 1
              );
              const displayedProducts = order.products.slice(
                (orderDetailsPage - 1) * orderDetailsItemsPerPage,
                orderDetailsPage * orderDetailsItemsPerPage
              );

              return (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Data do Pedido
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "pt-BR"
                            )
                          : order.date || "Data não disponível"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {getStatusBadge(order.status)}

                      {/* Status action buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {
                          // possible transitions
                        }
                        {(() => {
                          const transitions: Record<
                            string,
                            { label: string; value: string }[]
                          > = {
                            pendente: [
                              { label: "Confirmar", value: "confirmado" },
                              { label: "Cancelar", value: "cancelado" },
                            ],
                            confirmado: [
                              {
                                label: "Marcar como Enviado",
                                value: "enviado",
                              },
                              { label: "Cancelar", value: "cancelado" },
                            ],
                            enviado: [
                              {
                                label: "Marcar como Entregue",
                                value: "entregue",
                              },
                            ],
                            entregue: [],
                            cancelado: [],
                          };
                          const list = transitions[order.status] || [];

                          // Obter clientConfirmed do pedido (pode estar em order.raw ou currentOrder)
                          const orderRaw = (order as any).raw || currentOrder;
                          const clientConfirmed =
                            orderRaw?.clientConfirmed ||
                            (order as any).clientConfirmed ||
                            false;

                          return list.map((t) => {
                            // Se for "entregue", verificar se o cliente confirmou
                            const isDeliveredAction = t.value === "entregue";
                            const canMarkAsDelivered =
                              !isDeliveredAction || clientConfirmed;

                            return (
                              <div
                                key={t.value}
                                className="flex flex-col gap-1"
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    isUpdatingStatus || !canMarkAsDelivered
                                  }
                                  onClick={() => {
                                    if (t.value === "cancelado") {
                                      setConfirmDialog({
                                        open: true,
                                        action: "cancelOrder",
                                        id: order.id,
                                      });
                                    } else {
                                      handleChangeOrderStatus(
                                        order.id,
                                        t.value
                                      );
                                    }
                                  }}
                                  className="text-xs sm:text-sm"
                                  title={
                                    isDeliveredAction && !clientConfirmed
                                      ? "O cliente precisa confirmar o recebimento antes de marcar como entregue"
                                      : undefined
                                  }
                                >
                                  {t.label}
                                </Button>
                                {isDeliveredAction && !clientConfirmed && (
                                  <p className="text-[10px] text-muted-foreground text-center">
                                    Aguardando confirmação do cliente
                                  </p>
                                )}
                                {isDeliveredAction && clientConfirmed && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] w-fit mx-auto"
                                  >
                                    Cliente confirmou
                                  </Badge>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground">
                      Produtos ({order.products.length})
                    </h3>
                    {displayedProducts.map((item, index) => {
                      const product = item.product || {};
                      return (
                        <div
                          key={item._id || index}
                          className="flex gap-3 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg"
                        >
                          <img
                            src={`${productionUrl}/img/products/${product.imageCover}`}
                            alt={product.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://i.pinimg.com/1200x/a7/2f/db/a72fdbea7e86c3fb70a17c166a36407b.jpg";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base text-foreground break-words">
                              {product.name || "Produto não encontrado"}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {product.category?.name ||
                                product.category ||
                                "Sem categoria"}
                            </p>
                            {product.color && (
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Cor: {product.color}
                              </p>
                            )}
                            {product.size && (
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Tamanho: {product.size}
                              </p>
                            )}
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              Quantidade: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-sm sm:text-base text-foreground">
                              {(item.price * item.quantity).toFixed(2)} MZN
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {item.price.toFixed(2)} MZN cada
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {totalProductPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                setOrderDetailsPage((prev) =>
                                  Math.max(1, prev - 1)
                                )
                              }
                              className={
                                orderDetailsPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {Array.from(
                            { length: totalProductPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setOrderDetailsPage(page)}
                                isActive={orderDetailsPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setOrderDetailsPage((prev) =>
                                  Math.min(totalProductPages, prev + 1)
                                )
                              }
                              className={
                                orderDetailsPage === totalProductPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base sm:text-lg font-semibold">
                      Total
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-accent">
                      {order.total.toFixed(2)} MZN
                    </span>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for destructive actions (remove customer, cancel order) */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {confirmDialog.action === "removeCustomer"
                ? "Confirmar desativação"
                : confirmDialog.action === "deleteCoupon"
                ? "Confirmar exclusão"
                : confirmDialog.action === "deleteProduct"
                ? "Confirmar exclusão"
                : confirmDialog.action === "deleteReview"
                ? "Confirmar exclusão de comentário"
                : confirmDialog.action === "deleteVariant"
                ? "Confirmar exclusão de variante"
                : "Confirmar cancelamento"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {confirmDialog.action === "removeCustomer" ? (
                <>
                  Tem certeza que deseja desativar o cliente "
                  {confirmDialog.name}
                  "? O cliente não poderá mais fazer login, mas seus dados serão
                  mantidos.
                </>
              ) : confirmDialog.action === "deleteCoupon" ? (
                <>
                  Tem certeza que deseja excluir o cupom "{confirmDialog.name}"?
                  Esta ação não pode ser desfeita.
                </>
              ) : confirmDialog.action === "deleteProduct" ? (
                <>
                  Tem certeza que deseja excluir o produto "{confirmDialog.name}
                  "? Esta ação não pode ser desfeita.
                </>
              ) : confirmDialog.action === "deleteReview" ? (
                <>
                  Tem certeza que deseja excluir o comentário de "
                  {confirmDialog.name}"?
                  {confirmDialog.reviewText && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs italic">
                      "{confirmDialog.reviewText}"
                    </div>
                  )}
                  <div className="mt-2 text-destructive font-medium">
                    Esta ação não pode ser desfeita.
                  </div>
                </>
              ) : confirmDialog.action === "deleteVariant" ? (
                <>
                  Tem certeza que deseja excluir a variante "
                  {confirmDialog.name}" (SKU: {confirmDialog.variantSku})?
                  <div className="mt-2 text-destructive font-medium">
                    A imagem da variante também será apagada. Esta ação não pode
                    ser desfeita.
                  </div>
                </>
              ) : (
                <>
                  Tem certeza que deseja cancelar o pedido #
                  {confirmDialog.id?.slice(-8)}? Esta ação não pode ser
                  desfeita.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, action: null })}
              className="w-full sm:w-auto text-sm"
            >
              Cancelar
            </Button>
            <Button
              variant={
                confirmDialog.action === "removeCustomer" ||
                confirmDialog.action === "deleteCoupon" ||
                confirmDialog.action === "deleteProduct" ||
                confirmDialog.action === "deleteReview" ||
                confirmDialog.action === "deleteVariant"
                  ? "destructive"
                  : "default"
              }
              onClick={handleConfirmDialog}
              disabled={isConfirming || isUpdatingStatus}
              className="w-full sm:w-auto text-sm"
            >
              {isConfirming || isUpdatingStatus
                ? "Processando..."
                : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              Editar Produto
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Atualize as informações do produto e suas variantes
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <form
              onSubmit={handleUpdateProduct}
              className="space-y-4 sm:space-y-6"
            >
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm">
                    Nome do Produto *
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingProduct.name as string}
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price" className="text-sm">
                    Preço (MZN) *
                  </Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingProduct.price as number}
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priceDiscount" className="text-sm">
                    Preço com Desconto (MZN)
                  </Label>
                  <Input
                    id="edit-priceDiscount"
                    name="priceDiscount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editingProduct.priceDiscount || ""}
                    placeholder="Deixe vazio se não houver desconto"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Preço promocional (deve ser menor que o preço normal)
                  </p>
                </div>
                {/* Mostrar campo de estoque apenas se o produto não tiver variantes */}
                {(!editingProduct.variants ||
                  editingProduct.variants.length === 0) &&
                  (!editingProduct.variations ||
                    editingProduct.variations.length === 0) &&
                  (!editingProduct.colors ||
                    editingProduct.colors.length === 0) && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-stock" className="text-sm">
                        Estoque *
                      </Label>
                      <Input
                        id="edit-stock"
                        name="stock"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={editingProduct.stock || 0}
                        required
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Estoque para produtos sem variantes
                      </p>
                    </div>
                  )}
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-category" className="text-sm">
                    Categoria *
                  </Label>
                  <Select
                    name="category"
                    defaultValue={editingProduct.category as string}
                    required
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Camisetas">Camisetas</SelectItem>
                      <SelectItem value="Vestidos">Vestidos</SelectItem>
                      <SelectItem value="Jaquetas">Jaquetas</SelectItem>
                      <SelectItem value="Calças">Calças</SelectItem>
                      <SelectItem value="Blazers">Blazers</SelectItem>
                      <SelectItem value="Calçados">Calçados</SelectItem>
                      <SelectItem value="Casacos">Casacos</SelectItem>
                      <SelectItem value="Carteiras">Carteiras</SelectItem>
                      <SelectItem value="Saias">Saias</SelectItem>
                      <SelectItem value="Moletons">Moletons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gender" className="text-sm">
                    Gênero *
                  </Label>
                  <Select
                    name="gender"
                    defaultValue={editingProduct.gender as string}
                    required
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Unissex">Unissex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-description" className="text-sm">
                    Descrição
                  </Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    rows={4}
                    defaultValue={(editingProduct.description as string) || ""}
                    className="text-sm resize-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Imagem Principal</Label>
                {!editProductImagePreview ? (
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center w-full h-40 sm:h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors bg-muted/30">
                      <div className="flex flex-col items-center justify-center pt-6 sm:pt-8 pb-6 sm:pb-8">
                        <Upload className="w-8 h-8 sm:w-10 sm:h-10 mb-3 text-muted-foreground" />
                        <p className="text-sm sm:text-base text-muted-foreground text-center px-4 font-medium">
                          Clique para atualizar a imagem
                        </p>
                        <p className="text-xs text-muted-foreground/70 text-center px-4 mt-1">
                          PNG, JPG ou JPEG até 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleEditProductImageUpload}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="relative w-full">
                    <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden border-2 border-border bg-muted/20">
                      <img
                        src={editProductImagePreview}
                        alt="Preview da imagem do produto"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-3 right-3 h-9 w-9 shadow-lg"
                        onClick={handleResetEditImage}
                        title="Remover imagem"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-3 left-3 right-3 opacity-0 hover:opacity-100 transition-opacity">
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleEditProductImageUpload}
                            id="replace-edit-image-input"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="w-full shadow-lg"
                            onClick={(e) => {
                              e.preventDefault();
                              const input = document.getElementById(
                                "replace-edit-image-input"
                              ) as HTMLInputElement;
                              input?.click();
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Trocar imagem
                          </Button>
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Imagem selecionada. Clique em "Trocar imagem" para
                      substituir.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingProduct(null);
                    setEditProductImageFile(null);
                    setEditProductImagePreview("");
                    resetVariantFormState();
                  }}
                  className="w-full sm:w-auto text-sm"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto text-sm">
                  <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Variant Dialog */}
      <Dialog
        open={isVariantDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsVariantDialogOpen(false);
            handleCancelEditVariant();
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {isEditVariantMode ? "Editar Variante" : "Criar Nova Variante"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {isEditVariantMode
                ? "Atualize os dados da variante. A imagem é opcional ao editar."
                : "Selecione um produto e defina cor, tamanho, SKU, estoque e imagem."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!isEditVariantMode && (
              <div className="space-y-2">
                <Label className="text-sm">Produto *</Label>
                <Select
                  value={selectedProductForVariant}
                  onValueChange={setSelectedProductForVariant}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione o produto ao qual esta variante pertence
                </p>
              </div>
            )}

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm">Cor *</Label>
                <Input
                  type="color"
                  value={variantForm.color}
                  onChange={(e) =>
                    setVariantForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="h-10 sm:h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Tamanho *</Label>
                <Input
                  placeholder="Ex: M"
                  value={variantForm.size}
                  onChange={(e) =>
                    setVariantForm((prev) => ({
                      ...prev,
                      size: e.target.value,
                    }))
                  }
                  className="text-sm"
                />
              </div>
              <div className="space-y-2 sm:col-span-1 md:col-span-1">
                <Label className="text-sm">SKU *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: camisa-preta-m"
                    value={variantForm.sku}
                    onChange={(e) => {
                      skuManuallyEdited.current = true; // Marcar como editado manualmente
                      setVariantForm((prev) => ({
                        ...prev,
                        sku: e.target.value,
                      }));
                    }}
                    className="text-sm flex-1"
                  />
                  {!isEditVariantMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const productId =
                          activeTab === "variants"
                            ? selectedProductForVariant
                            : editingProduct?._id ||
                              (editingProduct as { id?: string })?.id;

                        if (!productId) {
                          toast({
                            title: "Selecione um produto",
                            description:
                              "Selecione um produto antes de gerar o SKU.",
                            variant: "destructive",
                          });
                          return;
                        }

                        if (!variantForm.size) {
                          toast({
                            title: "Preencha o tamanho",
                            description:
                              "Preencha o tamanho antes de gerar o SKU.",
                            variant: "destructive",
                          });
                          return;
                        }

                        const product = products.find(
                          (p) => p._id === productId || p.id === productId
                        );
                        if (!product) {
                          toast({
                            title: "Produto não encontrado",
                            description:
                              "Não foi possível encontrar o produto selecionado.",
                            variant: "destructive",
                          });
                          return;
                        }

                        const autoSKU = generateSKU(
                          product.name,
                          variantForm.color,
                          variantForm.size
                        );
                        if (autoSKU) {
                          skuManuallyEdited.current = false; // Resetar flag ao gerar automaticamente
                          setVariantForm((prev) => ({
                            ...prev,
                            sku: autoSKU,
                          }));
                          toast({
                            title: "SKU gerado",
                            description: `SKU "${autoSKU}" gerado com sucesso.`,
                          });
                        } else {
                          toast({
                            title: "Erro ao gerar SKU",
                            description:
                              "Não foi possível gerar o SKU. Verifique se o produto e tamanho estão preenchidos.",
                            variant: "destructive",
                          });
                        }
                      }}
                      title="Gerar SKU automaticamente"
                      className="flex-shrink-0"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {!isEditVariantMode
                    ? "SKU gerado automaticamente. Você pode editar se necessário."
                    : "Edite o SKU se necessário."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Estoque *</Label>
              <Input
                type="number"
                min="0"
                value={variantForm.stock}
                onChange={(e) =>
                  setVariantForm((prev) => ({
                    ...prev,
                    stock: parseInt(e.target.value) || 0,
                  }))
                }
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Imagem da Variante {isEditVariantMode ? "(opcional)" : "*"}
              </Label>
              {!variantForm.imagePreview ? (
                <div className="flex-1">
                  <label className="flex flex-col items-center justify-center w-full h-40 sm:h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors bg-muted/30">
                    <div className="flex flex-col items-center justify-center pt-6 sm:pt-8 pb-6 sm:pb-8">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 mb-3 text-muted-foreground" />
                      <p className="text-sm sm:text-base text-muted-foreground text-center px-4 font-medium">
                        Clique para fazer upload da imagem
                      </p>
                      <p className="text-xs text-muted-foreground/70 text-center px-4 mt-1">
                        PNG, JPG ou JPEG até 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleVariantImageUpload}
                    />
                  </label>
                </div>
              ) : (
                <div className="relative w-full">
                  <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden border-2 border-border bg-muted/20">
                    <img
                      src={variantForm.imagePreview}
                      alt="Preview da imagem da variante"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-3 right-3 h-9 w-9 shadow-lg"
                      onClick={() =>
                        setVariantForm((prev) => ({
                          ...prev,
                          imageFile: null,
                          imagePreview: "",
                        }))
                      }
                      title="Remover imagem"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 hover:opacity-100 transition-opacity">
                      <label className="block cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleVariantImageUpload}
                          id="replace-variant-image-input"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full shadow-lg"
                          onClick={(e) => {
                            e.preventDefault();
                            const input = document.getElementById(
                              "replace-variant-image-input"
                            ) as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Trocar imagem
                        </Button>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Imagem selecionada. Clique em "Trocar imagem" para
                    substituir.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={
                  isEditVariantMode
                    ? handleCancelEditVariant
                    : resetVariantFormState
                }
                disabled={variantLoading}
                className="w-full sm:w-auto text-sm"
              >
                {isEditVariantMode ? "Cancelar" : "Limpar"}
              </Button>
              <Button
                type="button"
                onClick={handleCreateVariant}
                disabled={variantLoading}
                className="w-full sm:w-auto text-sm"
              >
                {variantLoading
                  ? "Salvando..."
                  : isEditVariantMode
                  ? "Atualizar Variante"
                  : "Adicionar Variante"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Coupon Dialog */}
      <Dialog
        open={isCreateCouponDialogOpen || isEditCouponDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateCouponDialogOpen(false);
            setIsEditCouponDialogOpen(false);
            setEditingCoupon(null);
            setCouponForm({
              code: "",
              discount: "",
              type: "percentage",
              expiresAt: "",
              minPurchaseAmount: "",
              maxDiscountAmount: "",
              usageLimit: "1",
              assignedTo: "",
            });
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingCoupon
                ? "Atualize as informações do cupom"
                : "Preencha os dados para criar um novo cupom"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                !couponForm.code ||
                !couponForm.discount ||
                !couponForm.expiresAt
              ) {
                toast({
                  title: "Erro",
                  description: "Preencha todos os campos obrigatórios",
                  variant: "destructive",
                });
                return;
              }

              try {
                const couponData = {
                  code: couponForm.code.toUpperCase(),
                  discount: parseFloat(couponForm.discount),
                  type: couponForm.type,
                  expiresAt: new Date(couponForm.expiresAt).toISOString(),
                  assignedTo: couponForm.assignedTo || undefined,
                  minPurchaseAmount: couponForm.minPurchaseAmount
                    ? parseFloat(couponForm.minPurchaseAmount)
                    : undefined,
                  maxDiscountAmount: couponForm.maxDiscountAmount
                    ? parseFloat(couponForm.maxDiscountAmount)
                    : undefined,
                  usageLimit: parseInt(couponForm.usageLimit),
                  isActive: true,
                };

                if (editingCoupon) {
                  await dispatch(
                    updateCoupon({
                      id: editingCoupon._id,
                      data: couponData,
                    })
                  ).unwrap();
                  toast({
                    title: "Cupom atualizado",
                    description: `O cupom ${couponForm.code} foi atualizado com sucesso.`,
                  });
                } else {
                  await dispatch(createCoupon(couponData)).unwrap();
                  toast({
                    title: "Cupom criado",
                    description: `O cupom ${couponForm.code} foi criado com sucesso.`,
                  });
                }

                await dispatch(getAllCoupons());
                setIsCreateCouponDialogOpen(false);
                setIsEditCouponDialogOpen(false);
                setEditingCoupon(null);
                setCouponForm({
                  code: "",
                  discount: "",
                  type: "percentage",
                  expiresAt: "",
                  minPurchaseAmount: "",
                  maxDiscountAmount: "",
                  usageLimit: "1",
                  assignedTo: "",
                });
              } catch (error: any) {
                toast({
                  title: "Erro",
                  description: error || "Não foi possível salvar o cupom",
                  variant: "destructive",
                });
              }
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-code" className="text-sm">
                  Código do Cupom *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon-code"
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="Ex: DESCONTO20"
                    className="text-sm uppercase"
                    required
                    disabled={!!editingCoupon}
                  />
                  {!editingCoupon && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateCouponCode}
                      className="shrink-0"
                    >
                      Gerar
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-type" className="text-sm">
                  Tipo de Desconto *
                </Label>
                <Select
                  value={couponForm.type}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setCouponForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger id="coupon-type" className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (MZN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-discount" className="text-sm">
                  Desconto *
                </Label>
                <Input
                  id="coupon-discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={couponForm.discount}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      discount: e.target.value,
                    }))
                  }
                  placeholder={
                    couponForm.type === "percentage" ? "Ex: 20" : "Ex: 50"
                  }
                  className="text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {couponForm.type === "percentage"
                    ? "Percentual de desconto (0-100)"
                    : "Valor fixo em MZN"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-expires" className="text-sm">
                  Data de Expiração *
                </Label>
                <Input
                  id="coupon-expires"
                  type="date"
                  min={getMinDate()}
                  value={couponForm.expiresAt}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      expiresAt: e.target.value,
                    }))
                  }
                  className="text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-min-purchase" className="text-sm">
                  Compra Mínima (MZN)
                </Label>
                <Input
                  id="coupon-min-purchase"
                  type="number"
                  step="0.01"
                  min="0"
                  value={couponForm.minPurchaseAmount}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      minPurchaseAmount: e.target.value,
                    }))
                  }
                  placeholder="Opcional"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon-usage-limit" className="text-sm">
                  Limite de Uso *
                </Label>
                <Input
                  id="coupon-usage-limit"
                  type="number"
                  min="1"
                  value={couponForm.usageLimit}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      usageLimit: e.target.value,
                    }))
                  }
                  placeholder="1"
                  className="text-sm"
                  required
                />
              </div>
            </div>

            {couponForm.type === "percentage" && (
              <div className="space-y-2">
                <Label htmlFor="coupon-max-discount" className="text-sm">
                  Desconto Máximo (MZN)
                </Label>
                <Input
                  id="coupon-max-discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={couponForm.maxDiscountAmount}
                  onChange={(e) =>
                    setCouponForm((prev) => ({
                      ...prev,
                      maxDiscountAmount: e.target.value,
                    }))
                  }
                  placeholder="Opcional"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Limite máximo de desconto em MZN (apenas para cupons
                  percentuais)
                </p>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateCouponDialogOpen(false);
                  setIsEditCouponDialogOpen(false);
                  setEditingCoupon(null);
                  setCouponForm({
                    code: "",
                    discount: "",
                    type: "percentage",
                    expiresAt: "",
                    minPurchaseAmount: "",
                    maxDiscountAmount: "",
                    usageLimit: "1",
                    assignedTo: "",
                  });
                }}
                className="w-full sm:w-auto text-sm"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={couponLoading}
                className="w-full sm:w-auto text-sm"
              >
                {couponLoading
                  ? "Salvando..."
                  : editingCoupon
                  ? "Atualizar Cupom"
                  : "Criar Cupom"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Seleção de Produto para Filtro */}
      <Dialog
        open={isProductSelectModalOpen}
        onOpenChange={setIsProductSelectModalOpen}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              Selecionar Produto
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Pesquise e selecione um produto para filtrar as variantes
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4 px-6 pt-4">
            {/* Input de Pesquisa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou categoria..."
                value={productSearchTerm}
                onChange={(e) => {
                  setProductSearchTerm(e.target.value);
                  setProductSelectPage(1); // Resetar página ao pesquisar
                }}
                className="pl-10 h-11 text-base"
              />
            </div>

            {/* Lista de Produtos */}
            <div className="flex-1 overflow-y-auto rounded-lg border bg-card">
              {(() => {
                // Filtrar produtos por termo de busca
                const filteredProducts = products.filter(
                  (product) =>
                    product.name
                      .toLowerCase()
                      .includes(productSearchTerm.toLowerCase()) ||
                    product.category
                      ?.toLowerCase()
                      .includes(productSearchTerm.toLowerCase())
                );

                // Calcular paginação
                const totalPages = Math.ceil(
                  filteredProducts.length / productSelectItemsPerPage
                );
                const paginatedProducts = filteredProducts.slice(
                  (productSelectPage - 1) * productSelectItemsPerPage,
                  productSelectPage * productSelectItemsPerPage
                );

                return (
                  <>
                    {paginatedProducts.length === 0 && productSearchTerm ? (
                      <div className="p-12 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground font-medium">
                          Nenhum produto encontrado
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tente pesquisar com outros termos
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {/* Opção "Todos os produtos" */}
                        <button
                          type="button"
                          onClick={() => {
                            setVariantProductFilter("all");
                            setVariantsPage(1);
                            setIsProductSelectModalOpen(false);
                            setProductSearchTerm("");
                            setProductSelectPage(1);
                          }}
                          className={`w-full p-4 text-left hover:bg-accent/50 transition-all duration-200 ${
                            variantProductFilter === "all"
                              ? "bg-primary/10 border-l-4 border-l-primary"
                              : "hover:border-l-4 hover:border-l-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                variantProductFilter === "all"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Package className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-base">
                                Todos os produtos
                              </div>
                              <div className="text-sm text-muted-foreground mt-0.5">
                                Mostrar todas as variantes cadastradas
                              </div>
                            </div>
                            {variantProductFilter === "all" && (
                              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Lista de produtos */}
                        {paginatedProducts.map((product) => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => {
                              setVariantProductFilter(product._id);
                              setVariantsPage(1);
                              setIsProductSelectModalOpen(false);
                              setProductSearchTerm("");
                              setProductSelectPage(1);
                            }}
                            className={`w-full p-4 text-left hover:bg-accent/50 transition-all duration-200 ${
                              variantProductFilter === product._id
                                ? "bg-primary/10 border-l-4 border-l-primary"
                                : "hover:border-l-4 hover:border-l-primary/30"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {product.imageCover ? (
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-border flex-shrink-0">
                                  <img
                                    src={`${productionUrl}/img/products/${product.imageCover}`}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center border-2 border-border flex-shrink-0">
                                  <Package className="h-7 w-7 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-base truncate">
                                  {product.name}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {product.category ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {product.category}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      Sem categoria
                                    </span>
                                  )}
                                </div>
                              </div>
                              {variantProductFilter === product._id && (
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                                  <Check className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Paginação */}
                    {(() => {
                      const filteredProducts = products.filter(
                        (product) =>
                          product.name
                            .toLowerCase()
                            .includes(productSearchTerm.toLowerCase()) ||
                          product.category
                            ?.toLowerCase()
                            .includes(productSearchTerm.toLowerCase())
                      );
                      const totalPages = Math.ceil(
                        filteredProducts.length / productSelectItemsPerPage
                      );

                      if (totalPages <= 1) return null;

                      return (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2 border-t">
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">
                              {filteredProducts.length}
                            </span>{" "}
                            produto(s) encontrado(s) • Página{" "}
                            <span className="font-medium">
                              {productSelectPage}
                            </span>{" "}
                            de <span className="font-medium">{totalPages}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setProductSelectPage((p) => Math.max(1, p - 1))
                              }
                              disabled={productSelectPage === 1}
                              className="h-9"
                            >
                              Anterior
                            </Button>
                            <div className="flex gap-1">
                              {Array.from(
                                { length: Math.min(5, totalPages) },
                                (_, i) => {
                                  let pageNum;
                                  if (totalPages <= 5) {
                                    pageNum = i + 1;
                                  } else if (productSelectPage <= 3) {
                                    pageNum = i + 1;
                                  } else if (
                                    productSelectPage >=
                                    totalPages - 2
                                  ) {
                                    pageNum = totalPages - 4 + i;
                                  } else {
                                    pageNum = productSelectPage - 2 + i;
                                  }
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={
                                        productSelectPage === pageNum
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() =>
                                        setProductSelectPage(pageNum)
                                      }
                                      className="w-9 h-9 p-0"
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                }
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setProductSelectPage((p) =>
                                  Math.min(totalPages, p + 1)
                                )
                              }
                              disabled={productSelectPage === totalPages}
                              className="h-9"
                            >
                              Próxima
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-4 border-t bg-muted/30">
            <Button
              variant="outline"
              onClick={() => {
                setIsProductSelectModalOpen(false);
                setProductSearchTerm("");
                setProductSelectPage(1);
              }}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrapper que faz as verificações de segurança ANTES de renderizar o conteúdo
// Isso garante que todos os hooks sejam sempre executados na mesma ordem
const Admin = () => {
  const { user: currentUser, isAuthenticated } = useAppSelector(
    (state) => state.user
  );

  const isManager = currentUser?.role === "manager";
  const isAdmin = currentUser?.role === "admin";

  // Verificação de segurança: apenas admin e manager podem acessar
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/auth" replace />;
  }

  if (currentUser.active === false) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin && !isManager) {
    return <Navigate to="/" replace />;
  }

  // Se passou todas as verificações, renderizar o conteúdo
  return <AdminContent />;
};

export default Admin;
