// reviewTypes.tsx

export interface IReviewUser {
  _id: string;
  name: string;
  photo?: string;
}

export interface IReview {
  _id: string;
  review: string; // required
  rating: number; // 1-5, required
  createdAt: string; // Date
  product: string; // ObjectId referenciando Product (required)
  user: string | IReviewUser; // ObjectId ou objeto populado (required)
}

export interface ReviewState {
  reviews: IReview[];
  selectedReview: IReview | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface ICreateReviewRequest {
  review: string; // required
  rating: number; // 1-5, required
  product: string; // ObjectId do produto (required)
  user?: string; // ObjectId do usuário (será definido pelo backend se não fornecido)
}

export interface IUpdateReviewRequest {
  id: string;
  data: Partial<{
    review: string;
    rating: number;
  }>;
}

