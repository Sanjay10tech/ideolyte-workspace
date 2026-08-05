export type UserRole = "admin" | "client" | "team_member";

export type ProjectStatus = "planning" | "in-progress" | "on-hold" | "completed" | "cancelled";
export type TaskStatus = "todo" | "in-progress" | "review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type MilestoneStatus = "upcoming" | "in-progress" | "completed";
export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "bank_transfer" | "credit_card" | "paypal" | "other";
export type TicketStatus = "open" | "in-progress" | "resolved" | "closed";
export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
export type AgreementStatus = "draft" | "active" | "expired" | "terminated";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          phone: string | null;
          company: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          company?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          phone?: string | null;
          company?: string | null;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          profile_id: string;
          company: string;
          website: string | null;
          address: string | null;
          notes: string | null;
          status: "active" | "inactive" | "pending";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          company: string;
          website?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: "active" | "inactive" | "pending";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          company?: string;
          website?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: "active" | "inactive" | "pending";
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description: string | null;
          status: ProjectStatus;
          progress: number;
          budget: number | null;
          start_date: string | null;
          deadline: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          progress?: number;
          budget?: number | null;
          start_date?: string | null;
          deadline?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          name?: string;
          description?: string | null;
          status?: ProjectStatus;
          progress?: number;
          budget?: number | null;
          start_date?: string | null;
          deadline?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: MilestoneStatus;
          due_date: string | null;
          completed_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: MilestoneStatus;
          due_date?: string | null;
          completed_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: MilestoneStatus;
          due_date?: string | null;
          completed_date?: string | null;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          milestone_id: string | null;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          assignee_id: string | null;
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          milestone_id?: string | null;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          assignee_id?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          milestone_id?: string | null;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          assignee_id?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      project_updates: {
        Row: {
          id: string;
          project_id: string;
          author_id: string;
          title: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          author_id: string;
          title: string;
          content: string;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          author_id?: string;
          title?: string;
          content?: string;
        };
      };
      quotations: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          quotation_number: string;
          title: string;
          description: string | null;
          total_amount: number;
          status: QuotationStatus;
          valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          project_id?: string | null;
          quotation_number: string;
          title: string;
          description?: string | null;
          total_amount?: number;
          status?: QuotationStatus;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          project_id?: string | null;
          quotation_number?: string;
          title?: string;
          description?: string | null;
          total_amount?: number;
          status?: QuotationStatus;
          valid_until?: string | null;
          updated_at?: string;
        };
      };
      quotation_items: {
        Row: {
          id: string;
          quotation_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          quotation_id: string;
          description: string;
          quantity?: number;
          unit_price: number;
          total?: number;
          sort_order?: number;
        };
        Update: {
          quotation_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
          sort_order?: number;
        };
      };
      agreements: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          content: string | null;
          status: AgreementStatus;
          signed_date: string | null;
          expiry_date: string | null;
          file_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          content?: string | null;
          status?: AgreementStatus;
          signed_date?: string | null;
          expiry_date?: string | null;
          file_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          title?: string;
          content?: string | null;
          status?: AgreementStatus;
          signed_date?: string | null;
          expiry_date?: string | null;
          file_url?: string | null;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          client_id: string;
          project_id: string | null;
          invoice_number: string;
          status: InvoiceStatus;
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total_amount: number;
          issued_date: string;
          due_date: string;
          paid_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          project_id?: string | null;
          invoice_number: string;
          status?: InvoiceStatus;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total_amount?: number;
          issued_date: string;
          due_date: string;
          paid_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          project_id?: string | null;
          invoice_number?: string;
          status?: InvoiceStatus;
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total_amount?: number;
          issued_date?: string;
          due_date?: string;
          paid_date?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity?: number;
          unit_price: number;
          total?: number;
          sort_order?: number;
        };
        Update: {
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
          sort_order?: number;
        };
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          client_id: string;
          amount: number;
          payment_method: PaymentMethod;
          transaction_id: string | null;
          notes: string | null;
          paid_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          client_id: string;
          amount: number;
          payment_method?: PaymentMethod;
          transaction_id?: string | null;
          notes?: string | null;
          paid_at?: string;
          created_at?: string;
        };
        Update: {
          invoice_id?: string;
          client_id?: string;
          amount?: number;
          payment_method?: PaymentMethod;
          transaction_id?: string | null;
          notes?: string | null;
          paid_at?: string;
        };
      };
      project_files: {
        Row: {
          id: string;
          project_id: string;
          uploaded_by: string;
          name: string;
          file_url: string;
          file_size: number;
          file_type: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          uploaded_by: string;
          name: string;
          file_url: string;
          file_size?: number;
          file_type?: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          project_id?: string;
          uploaded_by?: string;
          name?: string;
          file_url?: string;
          file_size?: number;
          file_type?: string;
          category?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          project_id: string | null;
          sender_id: string;
          receiver_id: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          sender_id: string;
          receiver_id: string;
          content: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          project_id?: string | null;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          read?: boolean;
        };
      };
      support_tickets: {
        Row: {
          id: string;
          client_id: string;
          subject: string;
          description: string;
          status: TicketStatus;
          priority: TaskPriority;
          assigned_to: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          subject: string;
          description: string;
          status?: TicketStatus;
          priority?: TaskPriority;
          assigned_to?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          subject?: string;
          description?: string;
          status?: TicketStatus;
          priority?: TaskPriority;
          assigned_to?: string | null;
          resolved_at?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          read?: boolean;
          link?: string | null;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown> | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      project_status: ProjectStatus;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      milestone_status: MilestoneStatus;
      invoice_status: InvoiceStatus;
      payment_method: PaymentMethod;
      ticket_status: TicketStatus;
      quotation_status: QuotationStatus;
      agreement_status: AgreementStatus;
    };
  };
}
