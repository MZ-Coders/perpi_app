-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addresses (
  id integer NOT NULL DEFAULT nextval('addresses_id_seq'::regclass),
  street character varying NOT NULL,
  city character varying NOT NULL,
  state character varying NOT NULL,
  zip_code character varying NOT NULL,
  latitude numeric,
  longitude numeric,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  user_uuid uuid,
  user_id uuid,
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_(id)
);
CREATE TABLE public.avaliacoes_entregadores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id uuid,
  entregador_id uuid,
  cliente_id uuid,
  nota integer CHECK (nota >= 1 AND nota <= 5),
  comentario text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT avaliacoes_entregadores_pkey PRIMARY KEY (id),
  CONSTRAINT avaliacoes_entregadores_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id),
  CONSTRAINT avaliacoes_entregadores_entregador_id_fkey FOREIGN KEY (entregador_id) REFERENCES public.entregadores(id),
  CONSTRAINT avaliacoes_entregadores_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES auth.users(id)
);
CREATE TABLE public.cart_items (
  id integer NOT NULL DEFAULT nextval('cart_items_id_seq'::regclass),
  cart_id integer NOT NULL,
  product_id integer NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price_at_add numeric NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id)
);
CREATE TABLE public.carts (
  id integer NOT NULL DEFAULT nextval('carts_id_seq'::regclass),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  user_uuid uuid,
  user_id uuid,
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_(id)
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  parent_id integer,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  img_url text,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.chat_messages (
  id integer NOT NULL DEFAULT nextval('chat_messages_id_seq'::regclass),
  order_id integer,
  message_text text NOT NULL,
  sent_at timestamp without time zone NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  sender_uuid uuid,
  receiver_uuid uuid,
  sender_id uuid,
  receiver_id uuid,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users_(id),
  CONSTRAINT chat_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users_(id)
);
CREATE TABLE public.deliveries (
  id integer NOT NULL DEFAULT nextval('deliveries_id_seq'::regclass),
  order_id integer NOT NULL UNIQUE,
  start_time timestamp without time zone,
  end_time timestamp without time zone,
  delivery_status USER-DEFINED NOT NULL DEFAULT 'pending'::order_status,
  pickup_latitude numeric NOT NULL,
  pickup_longitude numeric NOT NULL,
  delivery_latitude numeric NOT NULL,
  delivery_longitude numeric NOT NULL,
  distance_km numeric,
  delivery_fee numeric,
  confirmation_photo_url character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  driver_uuid uuid,
  driver_id uuid,
  CONSTRAINT deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT deliveries_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users_(id)
);
CREATE TABLE public.documentos_pendentes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entregador_id uuid,
  tipo_documento text NOT NULL,
  url_documento text NOT NULL,
  status text DEFAULT 'pendente'::text CHECK (status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text])),
  observacoes_admin text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documentos_pendentes_pkey PRIMARY KEY (id),
  CONSTRAINT documentos_pendentes_entregador_id_fkey FOREIGN KEY (entregador_id) REFERENCES public.entregadores(id)
);
CREATE TABLE public.driver_documents (
  id integer NOT NULL DEFAULT nextval('driver_documents_id_seq'::regclass),
  document_type character varying NOT NULL,
  document_url character varying NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  uploaded_at timestamp without time zone NOT NULL DEFAULT now(),
  approved_at timestamp without time zone,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  driver_id uuid,
  approved_by_admin_id uuid,
  CONSTRAINT driver_documents_pkey PRIMARY KEY (id),
  CONSTRAINT driver_documents_approved_by_admin_id_fkey FOREIGN KEY (approved_by_admin_id) REFERENCES public.users_(id),
  CONSTRAINT driver_documents_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users_(id)
);
CREATE TABLE public.driver_terms_acceptance (
  id integer NOT NULL DEFAULT nextval('driver_terms_acceptance_id_seq'::regclass),
  terms_version character varying NOT NULL,
  accepted_at timestamp without time zone NOT NULL DEFAULT now(),
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  driver_id uuid,
  CONSTRAINT driver_terms_acceptance_pkey PRIMARY KEY (id),
  CONSTRAINT driver_terms_acceptance_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users_(id)
);
CREATE TABLE public.entregadores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  nome_completo text NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  data_nascimento text,
  numero_bi text,
  numero_passaporte text,
  endereco text NOT NULL,
  foto_perfil text,
  foto_bi text,
  foto_passaporte text,
  status_verificacao text DEFAULT 'pendente'::text CHECK (status_verificacao = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text])),
  aceite_termos boolean DEFAULT false,
  veiculo_tipo text CHECK (veiculo_tipo = ANY (ARRAY['moto'::text, 'bicicleta'::text, 'carro'::text, 'pe'::text])),
  veiculo_placa text,
  conta_bancaria text,
  disponivel boolean DEFAULT false,
  avaliacao_media numeric DEFAULT 0,
  total_entregas integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT entregadores_pkey PRIMARY KEY (id),
  CONSTRAINT entregadores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.favorites (
  id integer NOT NULL DEFAULT nextval('favorites_id_seq'::regclass),
  product_id integer NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  user_uuid uuid,
  user_id uuid,
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_(id),
  CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.itens_pedido (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id uuid,
  produto_nome text NOT NULL,
  quantidade integer NOT NULL,
  preco_unitario numeric NOT NULL,
  preco_total numeric NOT NULL,
  CONSTRAINT itens_pedido_pkey PRIMARY KEY (id),
  CONSTRAINT itens_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  title character varying NOT NULL,
  message text NOT NULL,
  notification_type character varying,
  related_id integer,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  user_uuid uuid,
  user_id uuid,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_(id)
);
CREATE TABLE public.order_items (
  id integer NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id integer NOT NULL,
  product_id integer NOT NULL,
  quantity integer NOT NULL,
  price_at_purchase numeric NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.orders (
  id integer NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  delivery_address_id integer,
  total_amount numeric NOT NULL,
  order_status USER-DEFINED NOT NULL DEFAULT 'pending'::order_status,
  payment_method USER-DEFINED NOT NULL,
  payment_status USER-DEFINED NOT NULL DEFAULT 'pending'::transaction_status,
  cancellation_fee_applied boolean NOT NULL DEFAULT false,
  cancellation_reason text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  customer_uuid uuid,
  customer_id uuid,
  endereco_entrega text,
  cidade_entrega text,
  provincia_entrega text,
  pais_entrega text,
  latitude_entrega numeric,
  longitude_entrega numeric,
  entregador_id uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_delivery_address_id_fkey FOREIGN KEY (delivery_address_id) REFERENCES public.addresses(id),
  CONSTRAINT orders_entregador_id_fkey FOREIGN KEY (entregador_id) REFERENCES public.entregadores(id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users_(id)
);
CREATE TABLE public.pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  entregador_id uuid,
  status text DEFAULT 'novo'::text CHECK (status = ANY (ARRAY['novo'::text, 'atribuido'::text, 'aceito'::text, 'coletado'::text, 'em_transito'::text, 'entregue'::text, 'cancelado'::text])),
  endereco_coleta text NOT NULL,
  endereco_entrega text NOT NULL,
  coordenadas_coleta point,
  coordenadas_entrega point,
  distancia_km numeric,
  valor_entrega numeric,
  valor_total numeric,
  tempo_estimado integer,
  foto_confirmacao text,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pedidos_pkey PRIMARY KEY (id),
  CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES auth.users(id),
  CONSTRAINT pedidos_entregador_id_fkey FOREIGN KEY (entregador_id) REFERENCES public.entregadores(id)
);
CREATE TABLE public.product_promotions (
  product_id integer NOT NULL,
  promotion_id integer NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_promotions_pkey PRIMARY KEY (product_id, promotion_id),
  CONSTRAINT product_promotions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_promotions_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id)
);
CREATE TABLE public.products (
  id integer NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  price numeric NOT NULL,
  stock_quantity integer NOT NULL DEFAULT 0,
  category_id integer NOT NULL,
  image_url character varying,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  unidade character varying,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.promotions (
  id integer NOT NULL DEFAULT nextval('promotions_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  discount_percentage numeric,
  discount_amount numeric,
  start_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT promotions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rastreamento_pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id uuid,
  entregador_id uuid,
  latitude numeric,
  longitude numeric,
  status text NOT NULL,
  observacao text,
  foto_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rastreamento_pedidos_pkey PRIMARY KEY (id),
  CONSTRAINT rastreamento_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id),
  CONSTRAINT rastreamento_pedidos_entregador_id_fkey FOREIGN KEY (entregador_id) REFERENCES public.entregadores(id)
);
CREATE TABLE public.ratings (
  id integer NOT NULL DEFAULT nextval('ratings_id_seq'::regclass),
  product_id integer,
  order_id integer,
  rating_value integer NOT NULL,
  comment text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  rater_user_uuid uuid,
  rated_user_uuid uuid,
  rater_user_id uuid,
  rated_user_id uuid,
  CONSTRAINT ratings_pkey PRIMARY KEY (id),
  CONSTRAINT ratings_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT ratings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT ratings_rated_user_id_fkey FOREIGN KEY (rated_user_id) REFERENCES public.users_(id),
  CONSTRAINT ratings_rater_user_id_fkey FOREIGN KEY (rater_user_id) REFERENCES public.users_(id)
);
CREATE TABLE public.transactions (
  id integer NOT NULL DEFAULT nextval('transactions_id_seq'::regclass),
  order_id integer UNIQUE,
  amount numeric NOT NULL,
  transaction_type character varying NOT NULL,
  payment_method USER-DEFINED,
  transaction_status USER-DEFINED NOT NULL DEFAULT 'pending'::transaction_status,
  external_transaction_id character varying UNIQUE,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  user_id uuid,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users_(id),
  CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.users_ (
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  full_name character varying NOT NULL,
  user_role USER-DEFINED NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  social_id character varying UNIQUE,
  profile_picture_url character varying,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  uuid uuid DEFAULT gen_random_uuid() UNIQUE,
  nome text,
  sobrenome text,
  id uuid NOT NULL,
  celular text,
  cidade text,
  provincia text,
  pais text,
  endereco text,
  latitude numeric,
  longitude numeric,
  CONSTRAINT users__pkey PRIMARY KEY (id)
);