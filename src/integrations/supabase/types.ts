export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academia_areas: {
        Row: {
          ativo: boolean
          cor_kit: string
          created_at: string
          detalhe: string
          dwell_segundos: number
          id: string
          nome: string
          observacoes: string
          organizacao_id: string | null
          produto_obrigatorio: string
          qr_token: string
          tipo: string
          ultima_higienizacao: string | null
          ultimo_responsavel: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor_kit?: string
          created_at?: string
          detalhe?: string
          dwell_segundos?: number
          id?: string
          nome: string
          observacoes?: string
          organizacao_id?: string | null
          produto_obrigatorio?: string
          qr_token?: string
          tipo?: string
          ultima_higienizacao?: string | null
          ultimo_responsavel?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor_kit?: string
          created_at?: string
          detalhe?: string
          dwell_segundos?: number
          id?: string
          nome?: string
          observacoes?: string
          organizacao_id?: string | null
          produto_obrigatorio?: string
          qr_token?: string
          tipo?: string
          ultima_higienizacao?: string | null
          ultimo_responsavel?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_areas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academia_areas_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_higienizacoes: {
        Row: {
          area_id: string
          concluida_em: string
          cor_kit: string
          created_at: string
          dwell_segundos: number | null
          foto: string | null
          id: string
          observacoes: string
          organizacao_id: string | null
          produto: string
          qr_validado: boolean
          responsavel: string
          unit_id: string
        }
        Insert: {
          area_id: string
          concluida_em?: string
          cor_kit?: string
          created_at?: string
          dwell_segundos?: number | null
          foto?: string | null
          id?: string
          observacoes?: string
          organizacao_id?: string | null
          produto?: string
          qr_validado?: boolean
          responsavel?: string
          unit_id: string
        }
        Update: {
          area_id?: string
          concluida_em?: string
          cor_kit?: string
          created_at?: string
          dwell_segundos?: number | null
          foto?: string | null
          id?: string
          observacoes?: string
          organizacao_id?: string | null
          produto?: string
          qr_validado?: boolean
          responsavel?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_higienizacoes_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "academia_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academia_higienizacoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academia_higienizacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_laudos_ar: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          created_at: string
          emitido_em: string
          expira_em: string | null
          id: string
          observacoes: string
          organizacao_id: string | null
          registro_art: string | null
          responsavel_tecnico: string
          tipo: string
          unit_id: string
          updated_at: string
          validade_meses: number
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string
          emitido_em?: string
          expira_em?: string | null
          id?: string
          observacoes?: string
          organizacao_id?: string | null
          registro_art?: string | null
          responsavel_tecnico?: string
          tipo?: string
          unit_id: string
          updated_at?: string
          validade_meses?: number
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          created_at?: string
          emitido_em?: string
          expira_em?: string | null
          id?: string
          observacoes?: string
          organizacao_id?: string | null
          registro_art?: string | null
          responsavel_tecnico?: string
          tipo?: string
          unit_id?: string
          updated_at?: string
          validade_meses?: number
        }
        Relationships: [
          {
            foreignKeyName: "academia_laudos_ar_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academia_laudos_ar_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      acessos_gestor: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          escopo: string
          id: string
          nome: string
          organizacao_id: string
          prefeitura_id: string | null
          unit_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          escopo: string
          id?: string
          nome?: string
          organizacao_id: string
          prefeitura_id?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          escopo?: string
          id?: string
          nome?: string
          organizacao_id?: string
          prefeitura_id?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acessos_gestor_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acessos_gestor_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acessos_gestor_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      acessos_logistica: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          organizacao_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome?: string
          organizacao_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          organizacao_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acessos_logistica_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas: {
        Row: {
          created_at: string
          execucao_id: string | null
          id: string
          lido: boolean
          mensagem: string
          organizacao_id: string | null
          severidade: string
          tipo: string
          titulo: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          execucao_id?: string | null
          id?: string
          lido?: boolean
          mensagem?: string
          organizacao_id?: string | null
          severidade?: string
          tipo?: string
          titulo: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          execucao_id?: string | null
          id?: string
          lido?: boolean
          mensagem?: string
          organizacao_id?: string | null
          severidade?: string
          tipo?: string
          titulo?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "execucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      aplicacoes_insumo: {
        Row: {
          aplicado_em: string
          cliente_iniciais: string
          created_at: string
          execucao_id: string | null
          foto_frasco: string | null
          id: string
          insumo_id: string | null
          lat: number | null
          lng: number | null
          lote: string
          marca: string
          observacoes: string
          organizacao_id: string | null
          procedimento: string
          produto: string
          profissional_nome: string
          profissional_registro: string | null
          quantidade_utilizada: number | null
          registro_anvisa: string | null
          unidade_medida: string
          unit_id: string
          updated_at: string
          validade: string | null
        }
        Insert: {
          aplicado_em?: string
          cliente_iniciais?: string
          created_at?: string
          execucao_id?: string | null
          foto_frasco?: string | null
          id?: string
          insumo_id?: string | null
          lat?: number | null
          lng?: number | null
          lote?: string
          marca?: string
          observacoes?: string
          organizacao_id?: string | null
          procedimento?: string
          produto?: string
          profissional_nome?: string
          profissional_registro?: string | null
          quantidade_utilizada?: number | null
          registro_anvisa?: string | null
          unidade_medida?: string
          unit_id: string
          updated_at?: string
          validade?: string | null
        }
        Update: {
          aplicado_em?: string
          cliente_iniciais?: string
          created_at?: string
          execucao_id?: string | null
          foto_frasco?: string | null
          id?: string
          insumo_id?: string | null
          lat?: number | null
          lng?: number | null
          lote?: string
          marca?: string
          observacoes?: string
          organizacao_id?: string | null
          procedimento?: string
          produto?: string
          profissional_nome?: string
          profissional_registro?: string | null
          quantidade_utilizada?: number | null
          registro_anvisa?: string | null
          unidade_medida?: string
          unit_id?: string
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aplicacoes_insumo_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "execucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aplicacoes_insumo_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aplicacoes_insumo_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aplicacoes_insumo_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          ambiente: string
          autoclaves: number
          aviso_conversao_em: string | null
          cadeiras: number
          ciclo: string
          created_at: string
          entrega_cep: string | null
          entrega_cidade: string | null
          entrega_complemento: string | null
          entrega_destinatario: string | null
          entrega_documento: string | null
          entrega_numero: string | null
          entrega_rua: string | null
          entrega_uf: string | null
          id: string
          kit_insumos: boolean
          organizacao_id: string
          pagamento_provedor: string
          pagamento_referencia: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          plano: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_fim: string
          trial_inicio: string
          unidades_permitidas: number
          updated_at: string
        }
        Insert: {
          ambiente?: string
          autoclaves?: number
          aviso_conversao_em?: string | null
          cadeiras?: number
          ciclo?: string
          created_at?: string
          entrega_cep?: string | null
          entrega_cidade?: string | null
          entrega_complemento?: string | null
          entrega_destinatario?: string | null
          entrega_documento?: string | null
          entrega_numero?: string | null
          entrega_rua?: string | null
          entrega_uf?: string | null
          id?: string
          kit_insumos?: boolean
          organizacao_id: string
          pagamento_provedor?: string
          pagamento_referencia?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          plano?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_fim?: string
          trial_inicio?: string
          unidades_permitidas?: number
          updated_at?: string
        }
        Update: {
          ambiente?: string
          autoclaves?: number
          aviso_conversao_em?: string | null
          cadeiras?: number
          ciclo?: string
          created_at?: string
          entrega_cep?: string | null
          entrega_cidade?: string | null
          entrega_complemento?: string | null
          entrega_destinatario?: string | null
          entrega_documento?: string | null
          entrega_numero?: string | null
          entrega_rua?: string | null
          entrega_uf?: string | null
          id?: string
          kit_insumos?: boolean
          organizacao_id?: string
          pagamento_provedor?: string
          pagamento_referencia?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          plano?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_fim?: string
          trial_inicio?: string
          unidades_permitidas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      autoclave_cycles: {
        Row: {
          batch_number: string
          chemical_indicator_result: string
          compliance_profile_id: string | null
          corrective_action_log: string | null
          created_at: string
          cycle_date_time: string
          equipment_brand_model: string
          equipment_serial: string
          id: string
          is_immutable: boolean
          operator_name: string
          operator_user_id: string | null
          organizacao_id: string
          packages_list: string
          photo_integrator_url: string
          photo_panel_url: string | null
          pressure_bar: number
          reversal_of_id: string | null
          reversal_reason: string | null
          status: string
          temp_celsius: number
          time_minutes: number
        }
        Insert: {
          batch_number: string
          chemical_indicator_result: string
          compliance_profile_id?: string | null
          corrective_action_log?: string | null
          created_at?: string
          cycle_date_time: string
          equipment_brand_model: string
          equipment_serial: string
          id?: string
          is_immutable?: boolean
          operator_name: string
          operator_user_id?: string | null
          organizacao_id: string
          packages_list: string
          photo_integrator_url: string
          photo_panel_url?: string | null
          pressure_bar: number
          reversal_of_id?: string | null
          reversal_reason?: string | null
          status: string
          temp_celsius: number
          time_minutes: number
        }
        Update: {
          batch_number?: string
          chemical_indicator_result?: string
          compliance_profile_id?: string | null
          corrective_action_log?: string | null
          created_at?: string
          cycle_date_time?: string
          equipment_brand_model?: string
          equipment_serial?: string
          id?: string
          is_immutable?: boolean
          operator_name?: string
          operator_user_id?: string | null
          organizacao_id?: string
          packages_list?: string
          photo_integrator_url?: string
          photo_panel_url?: string | null
          pressure_bar?: number
          reversal_of_id?: string | null
          reversal_reason?: string | null
          status?: string
          temp_celsius?: number
          time_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "autoclave_cycles_compliance_profile_id_fkey"
            columns: ["compliance_profile_id"]
            isOneToOne: false
            referencedRelation: "compliance_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autoclave_cycles_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autoclave_cycles_reversal_of_id_fkey"
            columns: ["reversal_of_id"]
            isOneToOne: false
            referencedRelation: "autoclave_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      biological_tests: {
        Row: {
          autoclave_cycle_id: string | null
          corrective_action_log: string | null
          created_at: string
          id: string
          indicator_batch_number: string
          operator_name: string
          operator_user_id: string | null
          organizacao_id: string
          photo_vial_url: string | null
          result: string
          test_date: string
        }
        Insert: {
          autoclave_cycle_id?: string | null
          corrective_action_log?: string | null
          created_at?: string
          id?: string
          indicator_batch_number: string
          operator_name?: string
          operator_user_id?: string | null
          organizacao_id: string
          photo_vial_url?: string | null
          result: string
          test_date: string
        }
        Update: {
          autoclave_cycle_id?: string | null
          corrective_action_log?: string | null
          created_at?: string
          id?: string
          indicator_batch_number?: string
          operator_name?: string
          operator_user_id?: string | null
          organizacao_id?: string
          photo_vial_url?: string | null
          result?: string
          test_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "biological_tests_autoclave_cycle_id_fkey"
            columns: ["autoclave_cycle_id"]
            isOneToOne: false
            referencedRelation: "autoclave_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biological_tests_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      caixas_perfurocortantes: {
        Row: {
          capacidade_litros: number
          created_at: string
          foto_troca: string | null
          id: string
          local: string
          montada_em: string
          nivel_percentual: number
          organizacao_id: string | null
          responsavel: string
          status: string
          trocada_em: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          capacidade_litros?: number
          created_at?: string
          foto_troca?: string | null
          id?: string
          local?: string
          montada_em?: string
          nivel_percentual?: number
          organizacao_id?: string | null
          responsavel?: string
          status?: string
          trocada_em?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          capacidade_litros?: number
          created_at?: string
          foto_troca?: string | null
          id?: string
          local?: string
          montada_em?: string
          nivel_percentual?: number
          organizacao_id?: string | null
          responsavel?: string
          status?: string
          trocada_em?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caixas_perfurocortantes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caixas_perfurocortantes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_atribuicoes: {
        Row: {
          ativo: boolean
          checklist_id: string
          created_at: string
          frequencia: string
          id: string
          unit_id: string
        }
        Insert: {
          ativo?: boolean
          checklist_id: string
          created_at?: string
          frequencia?: string
          id?: string
          unit_id: string
        }
        Update: {
          ativo?: boolean
          checklist_id?: string
          created_at?: string
          frequencia?: string
          id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_atribuicoes_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_atribuicoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_itens: {
        Row: {
          ajuda: string | null
          checklist_id: string
          created_at: string
          critico: boolean
          dwell_segundos: number | null
          foto_obrigatoria: boolean
          id: string
          opcoes: Json
          ordem: number
          pergunta: string
          tipo: string
          unidade_medida: string | null
          valor_max: number | null
          valor_min: number | null
        }
        Insert: {
          ajuda?: string | null
          checklist_id: string
          created_at?: string
          critico?: boolean
          dwell_segundos?: number | null
          foto_obrigatoria?: boolean
          id?: string
          opcoes?: Json
          ordem?: number
          pergunta: string
          tipo?: string
          unidade_medida?: string | null
          valor_max?: number | null
          valor_min?: number | null
        }
        Update: {
          ajuda?: string | null
          checklist_id?: string
          created_at?: string
          critico?: boolean
          dwell_segundos?: number | null
          foto_obrigatoria?: boolean
          id?: string
          opcoes?: Json
          ordem?: number
          pergunta?: string
          tipo?: string
          unidade_medida?: string | null
          valor_max?: number | null
          valor_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_itens_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_logs: {
        Row: {
          checkpoint_id: string | null
          created_at: string
          data_json: Json
          frequency: string
          id: string
          lat: number | null
          lng: number | null
          operator_name: string
          organizacao_id: string
          photo_urls: Json
          reversal_of_id: string | null
          reversal_reason: string | null
          synced_at: string
          timestamp_gps: string
          user_id: string | null
        }
        Insert: {
          checkpoint_id?: string | null
          created_at?: string
          data_json?: Json
          frequency: string
          id?: string
          lat?: number | null
          lng?: number | null
          operator_name?: string
          organizacao_id: string
          photo_urls?: Json
          reversal_of_id?: string | null
          reversal_reason?: string | null
          synced_at?: string
          timestamp_gps?: string
          user_id?: string | null
        }
        Update: {
          checkpoint_id?: string | null
          created_at?: string
          data_json?: Json
          frequency?: string
          id?: string
          lat?: number | null
          lng?: number | null
          operator_name?: string
          organizacao_id?: string
          photo_urls?: Json
          reversal_of_id?: string | null
          reversal_reason?: string | null
          synced_at?: string
          timestamp_gps?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_logs_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "qr_checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_logs_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_logs_reversal_of_id_fkey"
            columns: ["reversal_of_id"]
            isOneToOne: false
            referencedRelation: "checklist_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_itens: {
        Row: {
          ajuda: string | null
          critico: boolean
          dwell_segundos: number | null
          foto_obrigatoria: boolean
          id: string
          opcoes: Json
          ordem: number
          pergunta: string
          template_id: string
          tipo: string
          unidade_medida: string | null
          valor_max: number | null
          valor_min: number | null
        }
        Insert: {
          ajuda?: string | null
          critico?: boolean
          dwell_segundos?: number | null
          foto_obrigatoria?: boolean
          id?: string
          opcoes?: Json
          ordem?: number
          pergunta: string
          template_id: string
          tipo?: string
          unidade_medida?: string | null
          valor_max?: number | null
          valor_min?: number | null
        }
        Update: {
          ajuda?: string | null
          critico?: boolean
          dwell_segundos?: number | null
          foto_obrigatoria?: boolean
          id?: string
          opcoes?: Json
          ordem?: number
          pergunta?: string
          template_id?: string
          tipo?: string
          unidade_medida?: string | null
          valor_max?: number | null
          valor_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_itens_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          categoria: string
          codigo: string
          created_at: string
          descricao: string
          id: string
          norma: string
          titulo: string
        }
        Insert: {
          categoria?: string
          codigo: string
          created_at?: string
          descricao?: string
          id?: string
          norma: string
          titulo: string
        }
        Update: {
          categoria?: string
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          norma?: string
          titulo?: string
        }
        Relationships: []
      }
      checklists: {
        Row: {
          ativo: boolean
          created_at: string
          criado_por: string | null
          descricao: string
          id: string
          norma: string
          organizacao_id: string
          origem_template_id: string | null
          pop_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          descricao?: string
          id?: string
          norma?: string
          organizacao_id: string
          origem_template_id?: string | null
          pop_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          criado_por?: string | null
          descricao?: string
          id?: string
          norma?: string
          organizacao_id?: string
          origem_template_id?: string | null
          pop_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_origem_template_id_fkey"
            columns: ["origem_template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_pop_id_fkey"
            columns: ["pop_id"]
            isOneToOne: false
            referencedRelation: "pops"
            referencedColumns: ["id"]
          },
        ]
      }
      chemical_products: {
        Row: {
          application_rate_l_m2: number
          ativo: boolean
          brand: string
          categoria: string
          color_kit_zone: string
          created_at: string
          dilution_label: string
          dilution_ratio: number
          dwell_time_seconds: number
          food_grade: boolean
          id: string
          min_stock_liters: number
          name: string
          organizacao_id: string | null
          package_liters: number
          price_per_liter: number
          requires_rinse: boolean
          residual_hours: number
          stock_liters: number
          updated_at: string
          usage_notes: string
        }
        Insert: {
          application_rate_l_m2?: number
          ativo?: boolean
          brand?: string
          categoria?: string
          color_kit_zone?: string
          created_at?: string
          dilution_label?: string
          dilution_ratio?: number
          dwell_time_seconds?: number
          food_grade?: boolean
          id?: string
          min_stock_liters?: number
          name: string
          organizacao_id?: string | null
          package_liters?: number
          price_per_liter?: number
          requires_rinse?: boolean
          residual_hours?: number
          stock_liters?: number
          updated_at?: string
          usage_notes?: string
        }
        Update: {
          application_rate_l_m2?: number
          ativo?: boolean
          brand?: string
          categoria?: string
          color_kit_zone?: string
          created_at?: string
          dilution_label?: string
          dilution_ratio?: number
          dwell_time_seconds?: number
          food_grade?: boolean
          id?: string
          min_stock_liters?: number
          name?: string
          organizacao_id?: string | null
          package_liters?: number
          price_per_liter?: number
          requires_rinse?: boolean
          residual_hours?: number
          stock_liters?: number
          updated_at?: string
          usage_notes?: string
        }
        Relationships: [
          {
            foreignKeyName: "chemical_products_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclos_autoclave: {
        Row: {
          ciclo: string
          created_at: string
          equipamento: string
          finalizado_em: string | null
          foto_integrador: string | null
          id: string
          indicador_biologico: string
          indicador_fisico: boolean
          indicador_quimico: boolean
          iniciado_em: string
          lote: string
          observacoes: string
          operador_nome: string
          operador_pin: string | null
          organizacao_id: string | null
          registrado_por: string | null
          status: string
          temperatura: number | null
          tempo_exposicao_min: number | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          ciclo?: string
          created_at?: string
          equipamento?: string
          finalizado_em?: string | null
          foto_integrador?: string | null
          id?: string
          indicador_biologico?: string
          indicador_fisico?: boolean
          indicador_quimico?: boolean
          iniciado_em?: string
          lote: string
          observacoes?: string
          operador_nome?: string
          operador_pin?: string | null
          organizacao_id?: string | null
          registrado_por?: string | null
          status?: string
          temperatura?: number | null
          tempo_exposicao_min?: number | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          ciclo?: string
          created_at?: string
          equipamento?: string
          finalizado_em?: string | null
          foto_integrador?: string | null
          id?: string
          indicador_biologico?: string
          indicador_fisico?: boolean
          indicador_quimico?: boolean
          iniciado_em?: string
          lote?: string
          observacoes?: string
          operador_nome?: string
          operador_pin?: string | null
          organizacao_id?: string | null
          registrado_por?: string | null
          status?: string
          temperatura?: number | null
          tempo_exposicao_min?: number | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ciclos_autoclave_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ciclos_autoclave_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanings: {
        Row: {
          alergenos_zona: Json
          alerta_alergeno: string | null
          ambiente: string
          colaboradora_id: string | null
          colaboradora_nome: string | null
          cor_kit: string | null
          created_at: string
          distancia_metros: number | null
          duracao_seg: number | null
          dwell_cancelado_seg: number | null
          executado_em: string
          fora_da_area: boolean
          foto_antes: string | null
          foto_depois: string | null
          id: string
          itens_feitos: Json
          lat: number | null
          legacy_id: string | null
          lng: number | null
          local_id: string | null
          motivo_reprovacao: string | null
          nc_id: string | null
          nfc_validado: boolean
          pin_nome: string | null
          pin_operadora: string | null
          prefeitura_id: string
          qr_validado: boolean
          refaz_de: string | null
          registrado_por: string | null
          revisado_em: string | null
          revisado_por: string | null
          servente: string
          status: string
          tipo_limpeza: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          alergenos_zona?: Json
          alerta_alergeno?: string | null
          ambiente: string
          colaboradora_id?: string | null
          colaboradora_nome?: string | null
          cor_kit?: string | null
          created_at?: string
          distancia_metros?: number | null
          duracao_seg?: number | null
          dwell_cancelado_seg?: number | null
          executado_em?: string
          fora_da_area?: boolean
          foto_antes?: string | null
          foto_depois?: string | null
          id?: string
          itens_feitos?: Json
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          local_id?: string | null
          motivo_reprovacao?: string | null
          nc_id?: string | null
          nfc_validado?: boolean
          pin_nome?: string | null
          pin_operadora?: string | null
          prefeitura_id: string
          qr_validado?: boolean
          refaz_de?: string | null
          registrado_por?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          servente?: string
          status?: string
          tipo_limpeza?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          alergenos_zona?: Json
          alerta_alergeno?: string | null
          ambiente?: string
          colaboradora_id?: string | null
          colaboradora_nome?: string | null
          cor_kit?: string | null
          created_at?: string
          distancia_metros?: number | null
          duracao_seg?: number | null
          dwell_cancelado_seg?: number | null
          executado_em?: string
          fora_da_area?: boolean
          foto_antes?: string | null
          foto_depois?: string | null
          id?: string
          itens_feitos?: Json
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          local_id?: string | null
          motivo_reprovacao?: string | null
          nc_id?: string | null
          nfc_validado?: boolean
          pin_nome?: string | null
          pin_operadora?: string | null
          prefeitura_id?: string
          qr_validado?: boolean
          refaz_de?: string | null
          registrado_por?: string | null
          revisado_em?: string | null
          revisado_por?: string | null
          servente?: string
          status?: string
          tipo_limpeza?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleanings_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleanings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradoras: {
        Row: {
          ativo: boolean
          cpf: string | null
          created_at: string
          id: string
          legacy_id: string | null
          nome: string
          pin: string | null
          telefone: string | null
          turnos: Json
          unit_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cpf?: string | null
          created_at?: string
          id?: string
          legacy_id?: string | null
          nome: string
          pin?: string | null
          telefone?: string | null
          turnos?: Json
          unit_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cpf?: string | null
          created_at?: string
          id?: string
          legacy_id?: string | null
          nome?: string
          pin?: string | null
          telefone?: string | null
          turnos?: Json
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradoras_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_profiles: {
        Row: {
          address: string
          autoclave_brand_model: string
          autoclave_serial: string
          city: string
          clinic_name: string
          cnpj: string | null
          created_at: string
          cro: string
          id: string
          organizacao_id: string
          rt_council: string
          rt_name: string
          rt_number: string
          status: string
          type: string
          uf: string
          unit_id: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string
          autoclave_brand_model?: string
          autoclave_serial?: string
          city?: string
          clinic_name?: string
          cnpj?: string | null
          created_at?: string
          cro?: string
          id?: string
          organizacao_id: string
          rt_council?: string
          rt_name?: string
          rt_number?: string
          status?: string
          type?: string
          uf?: string
          unit_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string
          autoclave_brand_model?: string
          autoclave_serial?: string
          city?: string
          clinic_name?: string
          cnpj?: string | null
          created_at?: string
          cro?: string
          id?: string
          organizacao_id?: string
          rt_council?: string
          rt_name?: string
          rt_number?: string
          status?: string
          type?: string
          uf?: string
          unit_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_profiles_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_schedules: {
        Row: {
          assigned_role: string
          created_at: string
          description: string | null
          due_date: string
          frequency: string
          hora: string | null
          id: string
          is_completed: boolean
          last_completed_at: string | null
          organizacao_id: string
          task_type: string
          title: string
          updated_at: string
          weekday: number | null
        }
        Insert: {
          assigned_role?: string
          created_at?: string
          description?: string | null
          due_date?: string
          frequency?: string
          hora?: string | null
          id?: string
          is_completed?: boolean
          last_completed_at?: string | null
          organizacao_id: string
          task_type: string
          title: string
          updated_at?: string
          weekday?: number | null
        }
        Update: {
          assigned_role?: string
          created_at?: string
          description?: string | null
          due_date?: string
          frequency?: string
          hora?: string | null
          id?: string
          is_completed?: boolean
          last_completed_at?: string | null
          organizacao_id?: string
          task_type?: string
          title?: string
          updated_at?: string
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_schedules_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string
          id: string
          legacy_id: string | null
          prefeitura_id: string
          quantidade: number | null
          unidade: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          data: string
          descricao?: string
          id?: string
          legacy_id?: string | null
          prefeitura_id: string
          quantidade?: number | null
          unidade?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          legacy_id?: string | null
          prefeitura_id?: string
          quantidade?: number | null
          unidade?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_sdbpf: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          categoria: string
          created_at: string
          emitido_em: string | null
          expires_at: string | null
          id: string
          numero: string | null
          observacoes: string
          organizacao_id: string | null
          orgao_emissor: string | null
          titulo: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria: string
          created_at?: string
          emitido_em?: string | null
          expires_at?: string | null
          id?: string
          numero?: string | null
          observacoes?: string
          organizacao_id?: string | null
          orgao_emissor?: string | null
          titulo: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria?: string
          created_at?: string
          emitido_em?: string | null
          expires_at?: string | null
          id?: string
          numero?: string | null
          observacoes?: string
          organizacao_id?: string | null
          orgao_emissor?: string | null
          titulo?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_sdbpf_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_sdbpf_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_documents: {
        Row: {
          category: string
          clinic_name: string
          file_path: string | null
          generated_at: string
          id: string
          kind: string
          mime_type: string | null
          notes: string | null
          organizacao_id: string
          period_end: string | null
          period_start: string | null
          plan: string
          sha256: string
          size_bytes: number | null
          title: string
          uploaded_by: string | null
          valid_until: string | null
        }
        Insert: {
          category?: string
          clinic_name?: string
          file_path?: string | null
          generated_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          notes?: string | null
          organizacao_id: string
          period_end?: string | null
          period_start?: string | null
          plan?: string
          sha256: string
          size_bytes?: number | null
          title?: string
          uploaded_by?: string | null
          valid_until?: string | null
        }
        Update: {
          category?: string
          clinic_name?: string
          file_path?: string | null
          generated_at?: string
          id?: string
          kind?: string
          mime_type?: string | null
          notes?: string | null
          organizacao_id?: string
          period_end?: string | null
          period_start?: string | null
          plan?: string
          sha256?: string
          size_bytes?: number | null
          title?: string
          uploaded_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dossier_documents_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos_climatizacao: {
        Row: {
          ambiente: string
          ativo: boolean
          capacidade_btus: number | null
          created_at: string
          frequencia_limpeza_dias: number
          id: string
          identificacao: string
          instalado_em: string | null
          laudo_emitido_em: string | null
          laudo_expira_em: string | null
          laudo_nome: string | null
          laudo_url: string | null
          marca: string
          modelo: string
          numero_serie: string | null
          observacoes: string
          organizacao_id: string | null
          registro_crea: string | null
          responsavel_tecnico: string
          tipo: string
          ultima_limpeza: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          ambiente?: string
          ativo?: boolean
          capacidade_btus?: number | null
          created_at?: string
          frequencia_limpeza_dias?: number
          id?: string
          identificacao?: string
          instalado_em?: string | null
          laudo_emitido_em?: string | null
          laudo_expira_em?: string | null
          laudo_nome?: string | null
          laudo_url?: string | null
          marca?: string
          modelo?: string
          numero_serie?: string | null
          observacoes?: string
          organizacao_id?: string | null
          registro_crea?: string | null
          responsavel_tecnico?: string
          tipo?: string
          ultima_limpeza?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          ambiente?: string
          ativo?: boolean
          capacidade_btus?: number | null
          created_at?: string
          frequencia_limpeza_dias?: number
          id?: string
          identificacao?: string
          instalado_em?: string | null
          laudo_emitido_em?: string | null
          laudo_expira_em?: string | null
          laudo_nome?: string | null
          laudo_url?: string | null
          marca?: string
          modelo?: string
          numero_serie?: string | null
          observacoes?: string
          organizacao_id?: string | null
          registro_crea?: string | null
          responsavel_tecnico?: string
          tipo?: string
          ultima_limpeza?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_climatizacao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamentos_climatizacao_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_webhook: {
        Row: {
          created_at: string
          evento_id: string
          id: string
          origem: string
          tipo: string | null
        }
        Insert: {
          created_at?: string
          evento_id: string
          id?: string
          origem: string
          tipo?: string | null
        }
        Update: {
          created_at?: string
          evento_id?: string
          id?: string
          origem?: string
          tipo?: string | null
        }
        Relationships: []
      }
      execucoes: {
        Row: {
          assinatura: string | null
          checklist_id: string
          concluida_em: string | null
          created_at: string
          dispositivo: string | null
          executado_por: string | null
          executor_nome: string
          id: string
          idempotency_key: string
          iniciada_em: string
          lat: number | null
          lng: number | null
          organizacao_id: string | null
          pin_nome: string | null
          total_conformes: number
          total_itens: number
          total_nao_conformes: number
          unit_id: string
        }
        Insert: {
          assinatura?: string | null
          checklist_id: string
          concluida_em?: string | null
          created_at?: string
          dispositivo?: string | null
          executado_por?: string | null
          executor_nome?: string
          id?: string
          idempotency_key: string
          iniciada_em?: string
          lat?: number | null
          lng?: number | null
          organizacao_id?: string | null
          pin_nome?: string | null
          total_conformes?: number
          total_itens?: number
          total_nao_conformes?: number
          unit_id: string
        }
        Update: {
          assinatura?: string | null
          checklist_id?: string
          concluida_em?: string | null
          created_at?: string
          dispositivo?: string | null
          executado_por?: string | null
          executor_nome?: string
          id?: string
          idempotency_key?: string
          iniciada_em?: string
          lat?: number | null
          lng?: number | null
          organizacao_id?: string | null
          pin_nome?: string | null
          total_conformes?: number
          total_itens?: number
          total_nao_conformes?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execucoes_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      incidentes: {
        Row: {
          created_at: string
          descricao: string
          id: string
          lat: number | null
          legacy_id: string | null
          lng: number | null
          ocorrido_em: string
          prefeitura_id: string
          quantidade: number
          reportado_por: string
          tipo: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          id?: string
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          ocorrido_em?: string
          prefeitura_id: string
          quantidade?: number
          reportado_por?: string
          tipo: string
          unit_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          ocorrido_em?: string
          prefeitura_id?: string
          quantidade?: number
          reportado_por?: string
          tipo?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidentes_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidentes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos_lotes: {
        Row: {
          aberto_em: string | null
          categoria: string
          codigo_barras: string | null
          created_at: string
          fabricante: string
          foto_frasco: string | null
          id: string
          lote: string
          marca: string
          nome: string
          observacoes: string
          organizacao_id: string | null
          quantidade: number
          registro_anvisa: string | null
          unidade: string
          unit_id: string | null
          updated_at: string
          validade: string
          validade_apos_aberto_dias: number | null
        }
        Insert: {
          aberto_em?: string | null
          categoria?: string
          codigo_barras?: string | null
          created_at?: string
          fabricante?: string
          foto_frasco?: string | null
          id?: string
          lote: string
          marca?: string
          nome: string
          observacoes?: string
          organizacao_id?: string | null
          quantidade?: number
          registro_anvisa?: string | null
          unidade?: string
          unit_id?: string | null
          updated_at?: string
          validade: string
          validade_apos_aberto_dias?: number | null
        }
        Update: {
          aberto_em?: string | null
          categoria?: string
          codigo_barras?: string | null
          created_at?: string
          fabricante?: string
          foto_frasco?: string | null
          id?: string
          lote?: string
          marca?: string
          nome?: string
          observacoes?: string
          organizacao_id?: string | null
          quantidade?: number
          registro_anvisa?: string | null
          unidade?: string
          unit_id?: string | null
          updated_at?: string
          validade?: string
          validade_apos_aberto_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insumos_lotes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insumos_lotes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      license_expirations: {
        Row: {
          alert_lead_days: number[]
          created_at: string
          document_id: string | null
          document_type: string
          expiration_date: string
          id: string
          notes: string | null
          organizacao_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          alert_lead_days?: number[]
          created_at?: string
          document_id?: string | null
          document_type: string
          expiration_date: string
          id?: string
          notes?: string | null
          organizacao_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          alert_lead_days?: number[]
          created_at?: string
          document_id?: string | null
          document_type?: string
          expiration_date?: string
          id?: string
          notes?: string | null
          organizacao_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_expirations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "dossier_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_expirations_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes_climatizacao: {
        Row: {
          created_at: string
          equipamento_id: string
          executado_em: string
          executante: string
          foto: string | null
          id: string
          laudo_url: string | null
          observacoes: string
          organizacao_id: string | null
          proxima_em: string | null
          registro_executante: string | null
          tipo_servico: string
        }
        Insert: {
          created_at?: string
          equipamento_id: string
          executado_em?: string
          executante?: string
          foto?: string | null
          id?: string
          laudo_url?: string | null
          observacoes?: string
          organizacao_id?: string | null
          proxima_em?: string | null
          registro_executante?: string | null
          tipo_servico?: string
        }
        Update: {
          created_at?: string
          equipamento_id?: string
          executado_em?: string
          executante?: string
          foto?: string | null
          id?: string
          laudo_url?: string | null
          observacoes?: string
          organizacao_id?: string | null
          proxima_em?: string | null
          registro_executante?: string | null
          tipo_servico?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_climatizacao_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos_climatizacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_climatizacao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      medicoes_agua: {
        Row: {
          area_id: string | null
          cloro_mg_l: number | null
          corpo_dagua: string
          created_at: string
          fora_faixa: boolean
          id: string
          medido_em: string
          observacoes: string
          organizacao_id: string | null
          ph: number | null
          responsavel: string
          temperatura: number | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          cloro_mg_l?: number | null
          corpo_dagua?: string
          created_at?: string
          fora_faixa?: boolean
          id?: string
          medido_em?: string
          observacoes?: string
          organizacao_id?: string | null
          ph?: number | null
          responsavel?: string
          temperatura?: number | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          cloro_mg_l?: number | null
          corpo_dagua?: string
          created_at?: string
          fora_faixa?: boolean
          id?: string
          medido_em?: string
          observacoes?: string
          organizacao_id?: string | null
          ph?: number | null
          responsavel?: string
          temperatura?: number | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicoes_agua_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "academia_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_agua_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicoes_agua_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      nao_conformidades: {
        Row: {
          aberta_em: string
          acao_corretiva: string | null
          created_at: string
          dados: Json
          descricao: string
          id: string
          legacy_id: string | null
          liberada_em: string | null
          local_id: string | null
          origem: string
          prefeitura_id: string | null
          responsavel: string | null
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          aberta_em?: string
          acao_corretiva?: string | null
          created_at?: string
          dados?: Json
          descricao?: string
          id?: string
          legacy_id?: string | null
          liberada_em?: string | null
          local_id?: string | null
          origem: string
          prefeitura_id?: string | null
          responsavel?: string | null
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          aberta_em?: string
          acao_corretiva?: string | null
          created_at?: string
          dados?: Json
          descricao?: string
          id?: string
          legacy_id?: string | null
          liberada_em?: string | null
          local_id?: string | null
          origem?: string
          prefeitura_id?: string | null
          responsavel?: string | null
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nao_conformidades_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nao_conformidades_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          action_path: string | null
          channel: string
          created_at: string
          dedupe_key: string | null
          id: string
          message: string
          organizacao_id: string
          read_at: string | null
          sent_at: string
          severity: string
          task_type: string | null
          title: string
        }
        Insert: {
          action_path?: string | null
          channel?: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          message: string
          organizacao_id: string
          read_at?: string | null
          sent_at?: string
          severity?: string
          task_type?: string | null
          title: string
        }
        Update: {
          action_path?: string | null
          channel?: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          message?: string
          organizacao_id?: string
          read_at?: string | null
          sent_at?: string
          severity?: string
          task_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacao_membros: {
        Row: {
          created_at: string
          id: string
          organizacao_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizacao_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organizacao_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizacao_membros_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacoes: {
        Row: {
          bloqueado_em: string | null
          cnpj: string | null
          created_at: string
          email_contato: string | null
          gateway: string | null
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          id: string
          nome: string
          plano: string
          porte_dados: Json
          responsavel_cargo: string | null
          responsavel_cpf: string | null
          responsavel_email: string | null
          responsavel_nome: string | null
          responsavel_observacoes: string | null
          responsavel_telefone: string | null
          segmento: string
          status: string
          trial_expira_em: string
          updated_at: string
        }
        Insert: {
          bloqueado_em?: string | null
          cnpj?: string | null
          created_at?: string
          email_contato?: string | null
          gateway?: string | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          nome: string
          plano?: string
          porte_dados?: Json
          responsavel_cargo?: string | null
          responsavel_cpf?: string | null
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_observacoes?: string | null
          responsavel_telefone?: string | null
          segmento?: string
          status?: string
          trial_expira_em?: string
          updated_at?: string
        }
        Update: {
          bloqueado_em?: string | null
          cnpj?: string | null
          created_at?: string
          email_contato?: string | null
          gateway?: string | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          nome?: string
          plano?: string
          porte_dados?: Json
          responsavel_cargo?: string | null
          responsavel_cpf?: string | null
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_observacoes?: string | null
          responsavel_telefone?: string | null
          segmento?: string
          status?: string
          trial_expira_em?: string
          updated_at?: string
        }
        Relationships: []
      }
      pagamento_links: {
        Row: {
          ativo: boolean
          ciclo: string
          created_at: string
          id: string
          plano: string | null
          tipo: string
          updated_at: string
          url: string
        }
        Insert: {
          ativo?: boolean
          ciclo?: string
          created_at?: string
          id?: string
          plano?: string | null
          tipo?: string
          updated_at?: string
          url?: string
        }
        Update: {
          ativo?: boolean
          ciclo?: string
          created_at?: string
          id?: string
          plano?: string | null
          tipo?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          competencia: string
          created_at: string
          id: string
          legacy_id: string | null
          metodo: string | null
          observacao: string | null
          pago_em: string | null
          prefeitura_id: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          competencia: string
          created_at?: string
          id?: string
          legacy_id?: string | null
          metodo?: string | null
          observacao?: string | null
          pago_em?: string | null
          prefeitura_id: string
          updated_at?: string
          valor?: number
          vencimento: string
        }
        Update: {
          competencia?: string
          created_at?: string
          id?: string
          legacy_id?: string | null
          metodo?: string | null
          observacao?: string | null
          pago_em?: string | null
          prefeitura_id?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          categoria: string
          chemical_product_id: string | null
          created_at: string
          id: string
          observacoes: string
          pedido_id: string
          preco_unitario: number
          produto: string
          quantidade: number
          quantidade_entregue: number
          unidade: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          chemical_product_id?: string | null
          created_at?: string
          id?: string
          observacoes?: string
          pedido_id: string
          preco_unitario?: number
          produto: string
          quantidade?: number
          quantidade_entregue?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          chemical_product_id?: string | null
          created_at?: string
          id?: string
          observacoes?: string
          pedido_id?: string
          preco_unitario?: number
          produto?: string
          quantidade?: number
          quantidade_entregue?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_chemical_product_id_fkey"
            columns: ["chemical_product_id"]
            isOneToOne: false
            referencedRelation: "chemical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_insumos: {
        Row: {
          competencia: string
          created_at: string
          criado_por: string | null
          entregue_em: string | null
          fornecedor: string
          foto_entrega: string | null
          id: string
          nota_fiscal: string | null
          observacoes: string
          organizacao_id: string
          prefeitura_id: string
          previsao_entrega: string | null
          recebido_por: string
          status: string
          transportadora: string
          unit_id: string | null
          updated_at: string
          valor_total: number
        }
        Insert: {
          competencia: string
          created_at?: string
          criado_por?: string | null
          entregue_em?: string | null
          fornecedor?: string
          foto_entrega?: string | null
          id?: string
          nota_fiscal?: string | null
          observacoes?: string
          organizacao_id: string
          prefeitura_id: string
          previsao_entrega?: string | null
          recebido_por?: string
          status?: string
          transportadora?: string
          unit_id?: string | null
          updated_at?: string
          valor_total?: number
        }
        Update: {
          competencia?: string
          created_at?: string
          criado_por?: string | null
          entregue_em?: string | null
          fornecedor?: string
          foto_entrega?: string | null
          id?: string
          nota_fiscal?: string | null
          observacoes?: string
          organizacao_id?: string
          prefeitura_id?: string
          previsao_entrega?: string | null
          recebido_por?: string
          status?: string
          transportadora?: string
          unit_id?: string | null
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_insumos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_insumos_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_insumos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_acao: {
        Row: {
          acao_corretiva: string | null
          causa_raiz: string | null
          concluida_em: string | null
          created_at: string
          criticidade: string
          descricao: string
          execucao_id: string | null
          foto_evidencia: string | null
          id: string
          organizacao_id: string | null
          prazo: string | null
          responsavel: string
          resposta_id: string | null
          status: string
          titulo: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          acao_corretiva?: string | null
          causa_raiz?: string | null
          concluida_em?: string | null
          created_at?: string
          criticidade?: string
          descricao?: string
          execucao_id?: string | null
          foto_evidencia?: string | null
          id?: string
          organizacao_id?: string | null
          prazo?: string | null
          responsavel?: string
          resposta_id?: string | null
          status?: string
          titulo: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          acao_corretiva?: string | null
          causa_raiz?: string | null
          concluida_em?: string | null
          created_at?: string
          criticidade?: string
          descricao?: string
          execucao_id?: string | null
          foto_evidencia?: string | null
          id?: string
          organizacao_id?: string | null
          prazo?: string | null
          responsavel?: string
          resposta_id?: string | null
          status?: string
          titulo?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_acao_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "execucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_acao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_acao_resposta_id_fkey"
            columns: ["resposta_id"]
            isOneToOne: false
            referencedRelation: "respostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_acao_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pops: {
        Row: {
          arquivo_url: string | null
          codigo: string
          created_at: string
          descricao: string
          id: string
          norma: string
          organizacao_id: string | null
          revisado_em: string | null
          titulo: string
          updated_at: string
          versao: string
        }
        Insert: {
          arquivo_url?: string | null
          codigo: string
          created_at?: string
          descricao?: string
          id?: string
          norma?: string
          organizacao_id?: string | null
          revisado_em?: string | null
          titulo: string
          updated_at?: string
          versao?: string
        }
        Update: {
          arquivo_url?: string | null
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          norma?: string
          organizacao_id?: string | null
          revisado_em?: string | null
          titulo?: string
          updated_at?: string
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "pops_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      prefeituras: {
        Row: {
          cep: string | null
          cidade: string
          cnpj: string | null
          contrato_arquivo_nome: string | null
          contrato_arquivo_url: string | null
          contrato_assinado_em: string | null
          created_at: string
          cro: string
          dia_vencimento: number | null
          endereco: string | null
          fim_contrato: string | null
          id: string
          inicio_contrato: string | null
          lat: number | null
          legacy_id: string | null
          lng: number | null
          nome: string
          nome_fantasia: string | null
          numero_contrato: string | null
          observacoes: string | null
          organizacao_id: string | null
          razao_social: string | null
          registro_rt: string | null
          responsavel_qa: string | null
          responsavel_tecnico: string | null
          uf: string
          updated_at: string
          valor_mensal: number | null
          vertical: string
          vertical_type: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string
          cnpj?: string | null
          contrato_arquivo_nome?: string | null
          contrato_arquivo_url?: string | null
          contrato_assinado_em?: string | null
          created_at?: string
          cro?: string
          dia_vencimento?: number | null
          endereco?: string | null
          fim_contrato?: string | null
          id?: string
          inicio_contrato?: string | null
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          nome: string
          nome_fantasia?: string | null
          numero_contrato?: string | null
          observacoes?: string | null
          organizacao_id?: string | null
          razao_social?: string | null
          registro_rt?: string | null
          responsavel_qa?: string | null
          responsavel_tecnico?: string | null
          uf?: string
          updated_at?: string
          valor_mensal?: number | null
          vertical?: string
          vertical_type?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string
          cnpj?: string | null
          contrato_arquivo_nome?: string | null
          contrato_arquivo_url?: string | null
          contrato_assinado_em?: string | null
          created_at?: string
          cro?: string
          dia_vencimento?: number | null
          endereco?: string | null
          fim_contrato?: string | null
          id?: string
          inicio_contrato?: string | null
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          nome?: string
          nome_fantasia?: string | null
          numero_contrato?: string | null
          observacoes?: string | null
          organizacao_id?: string | null
          razao_social?: string | null
          registro_rt?: string | null
          responsavel_qa?: string | null
          responsavel_tecnico?: string | null
          uf?: string
          updated_at?: string
          valor_mensal?: number | null
          vertical?: string
          vertical_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefeituras_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          checkin: string | null
          checkout: string | null
          colaboradora_id: string
          created_at: string
          data: string
          id: string
          legacy_id: string | null
          turno: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          checkin?: string | null
          checkout?: string | null
          colaboradora_id: string
          created_at?: string
          data: string
          id?: string
          legacy_id?: string | null
          turno: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          checkin?: string | null
          checkout?: string | null
          colaboradora_id?: string
          created_at?: string
          data?: string
          id?: string
          legacy_id?: string | null
          turno?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_colaboradora_id_fkey"
            columns: ["colaboradora_id"]
            isOneToOne: false
            referencedRelation: "colaboradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      qr_checkpoints: {
        Row: {
          ativo: boolean
          code: string
          compliance_profile_id: string
          created_at: string
          custom_name: string
          id: string
          name: string
          organizacao_id: string
          updated_at: string
          zone_type: string
        }
        Insert: {
          ativo?: boolean
          code: string
          compliance_profile_id: string
          created_at?: string
          custom_name?: string
          id?: string
          name: string
          organizacao_id: string
          updated_at?: string
          zone_type: string
        }
        Update: {
          ativo?: boolean
          code?: string
          compliance_profile_id?: string
          created_at?: string
          custom_name?: string
          id?: string
          name?: string
          organizacao_id?: string
          updated_at?: string
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_checkpoints_compliance_profile_id_fkey"
            columns: ["compliance_profile_id"]
            isOneToOne: false
            referencedRelation: "compliance_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_checkpoints_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      rdc_diagnosticos: {
        Row: {
          concluido_em: string | null
          created_at: string
          id: string
          organizacao_id: string
          respostas: Json
          total_aplicaveis: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          id?: string
          organizacao_id: string
          respostas?: Json
          total_aplicaveis?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          id?: string
          organizacao_id?: string
          respostas?: Json
          total_aplicaveis?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdc_diagnosticos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdc_diagnosticos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rdc_evidencias: {
        Row: {
          arquivo_url: string | null
          artigo: string | null
          created_at: string
          descricao: string | null
          id: string
          organizacao_id: string
          requisito_codigo: string | null
          responsavel: string | null
          status: string
          titulo: string
          unit_id: string | null
          updated_at: string
          vinculo_id: string | null
          vinculo_tipo: string
        }
        Insert: {
          arquivo_url?: string | null
          artigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          organizacao_id: string
          requisito_codigo?: string | null
          responsavel?: string | null
          status?: string
          titulo: string
          unit_id?: string | null
          updated_at?: string
          vinculo_id?: string | null
          vinculo_tipo?: string
        }
        Update: {
          arquivo_url?: string | null
          artigo?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          organizacao_id?: string
          requisito_codigo?: string | null
          responsavel?: string | null
          status?: string
          titulo?: string
          unit_id?: string | null
          updated_at?: string
          vinculo_id?: string | null
          vinculo_tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdc_evidencias_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdc_evidencias_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rdc_leads: {
        Row: {
          aplicaveis: number
          categorias: Json
          cidade: string | null
          clinica: string | null
          convertido_em: string | null
          created_at: string
          email: string | null
          etapa: string
          id: string
          nome: string | null
          organizacao_id: string | null
          origem: string | null
          pendencias: number
          plano_escolhido: string | null
          respostas: Json
          score: number
          uf: string | null
          updated_at: string
          utm: Json
          whatsapp: string | null
        }
        Insert: {
          aplicaveis?: number
          categorias?: Json
          cidade?: string | null
          clinica?: string | null
          convertido_em?: string | null
          created_at?: string
          email?: string | null
          etapa?: string
          id?: string
          nome?: string | null
          organizacao_id?: string | null
          origem?: string | null
          pendencias?: number
          plano_escolhido?: string | null
          respostas?: Json
          score?: number
          uf?: string | null
          updated_at?: string
          utm?: Json
          whatsapp?: string | null
        }
        Update: {
          aplicaveis?: number
          categorias?: Json
          cidade?: string | null
          clinica?: string | null
          convertido_em?: string | null
          created_at?: string
          email?: string | null
          etapa?: string
          id?: string
          nome?: string | null
          organizacao_id?: string | null
          origem?: string | null
          pendencias?: number
          plano_escolhido?: string | null
          respostas?: Json
          score?: number
          uf?: string | null
          updated_at?: string
          utm?: Json
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rdc_leads_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      rdc_plano_itens: {
        Row: {
          artigo: string | null
          categoria: string
          codigo: string
          concluido_em: string | null
          created_at: string
          evidencia_url: string | null
          historico: Json
          id: string
          observacoes: string | null
          organizacao_id: string
          prazo: string | null
          requisito_id: string | null
          responsavel: string | null
          status: string
          titulo: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          artigo?: string | null
          categoria: string
          codigo: string
          concluido_em?: string | null
          created_at?: string
          evidencia_url?: string | null
          historico?: Json
          id?: string
          observacoes?: string | null
          organizacao_id: string
          prazo?: string | null
          requisito_id?: string | null
          responsavel?: string | null
          status?: string
          titulo: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          artigo?: string | null
          categoria?: string
          codigo?: string
          concluido_em?: string | null
          created_at?: string
          evidencia_url?: string | null
          historico?: Json
          id?: string
          observacoes?: string | null
          organizacao_id?: string
          prazo?: string | null
          requisito_id?: string | null
          responsavel?: string | null
          status?: string
          titulo?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdc_plano_itens_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdc_plano_itens_requisito_id_fkey"
            columns: ["requisito_id"]
            isOneToOne: false
            referencedRelation: "rdc_requisitos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdc_plano_itens_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rdc_requisitos: {
        Row: {
          aplicabilidade: string
          artigo: string | null
          ativo: boolean
          categoria: string
          codigo: string
          como_fazer: string
          condicao: string
          created_at: string
          descricao: string
          evidencia: string
          fonte: string
          id: string
          ordem: number
          organizacao_id: string | null
          prazo_dias: number
          referencia: string
          revisado_em: string
          situacao: string
          texto_simplificado: string
          titulo: string
          updated_at: string
          versao: string
        }
        Insert: {
          aplicabilidade?: string
          artigo?: string | null
          ativo?: boolean
          categoria: string
          codigo: string
          como_fazer?: string
          condicao?: string
          created_at?: string
          descricao?: string
          evidencia?: string
          fonte?: string
          id?: string
          ordem?: number
          organizacao_id?: string | null
          prazo_dias?: number
          referencia?: string
          revisado_em?: string
          situacao?: string
          texto_simplificado?: string
          titulo: string
          updated_at?: string
          versao?: string
        }
        Update: {
          aplicabilidade?: string
          artigo?: string | null
          ativo?: boolean
          categoria?: string
          codigo?: string
          como_fazer?: string
          condicao?: string
          created_at?: string
          descricao?: string
          evidencia?: string
          fonte?: string
          id?: string
          ordem?: number
          organizacao_id?: string | null
          prazo_dias?: number
          referencia?: string
          revisado_em?: string
          situacao?: string
          texto_simplificado?: string
          titulo?: string
          updated_at?: string
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdc_requisitos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      rdc_requisitos_historico: {
        Row: {
          alterado_por: string | null
          codigo: string
          created_at: string
          id: string
          requisito_id: string
          situacao: string
          snapshot: Json
          versao: string
        }
        Insert: {
          alterado_por?: string | null
          codigo: string
          created_at?: string
          id?: string
          requisito_id: string
          situacao: string
          snapshot: Json
          versao: string
        }
        Update: {
          alterado_por?: string | null
          codigo?: string
          created_at?: string
          id?: string
          requisito_id?: string
          situacao?: string
          snapshot?: Json
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdc_requisitos_historico_requisito_id_fkey"
            columns: ["requisito_id"]
            isOneToOne: false
            referencedRelation: "rdc_requisitos"
            referencedColumns: ["id"]
          },
        ]
      }
      rdc_riscos: {
        Row: {
          acao_corretiva: string | null
          acao_preventiva: string | null
          created_at: string
          criticidade: number | null
          evidencia_url: string | null
          id: string
          impacto: number
          organizacao_id: string
          prazo: string | null
          probabilidade: number
          responsavel: string | null
          risco: string
          setor: string | null
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          acao_corretiva?: string | null
          acao_preventiva?: string | null
          created_at?: string
          criticidade?: number | null
          evidencia_url?: string | null
          id?: string
          impacto?: number
          organizacao_id: string
          prazo?: string | null
          probabilidade?: number
          responsavel?: string | null
          risco: string
          setor?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          acao_corretiva?: string | null
          acao_preventiva?: string | null
          created_at?: string
          criticidade?: number | null
          evidencia_url?: string | null
          id?: string
          impacto?: number
          organizacao_id?: string
          prazo?: string | null
          probabilidade?: number
          responsavel?: string | null
          risco?: string
          setor?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdc_riscos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdc_riscos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rdc_score_historico: {
        Row: {
          created_at: string
          id: string
          organizacao_id: string
          por_categoria: Json
          referencia: string
          score: number
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organizacao_id: string
          por_categoria?: Json
          referencia?: string
          score?: number
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organizacao_id?: string
          por_categoria?: Json
          referencia?: string
          score?: number
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rdc_score_historico_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdc_score_historico_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      remessas_insumos: {
        Row: {
          assinatura_id: string
          codigo_rastreio: string | null
          created_at: string
          entregue_em: string | null
          enviado_em: string | null
          id: string
          observacoes: string | null
          organizacao_id: string
          quantidade_kits: number
          referencia_periodo: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assinatura_id: string
          codigo_rastreio?: string | null
          created_at?: string
          entregue_em?: string | null
          enviado_em?: string | null
          id?: string
          observacoes?: string | null
          organizacao_id: string
          quantidade_kits?: number
          referencia_periodo?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assinatura_id?: string
          codigo_rastreio?: string | null
          created_at?: string
          entregue_em?: string | null
          enviado_em?: string | null
          id?: string
          observacoes?: string | null
          organizacao_id?: string
          quantidade_kits?: number
          referencia_periodo?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "remessas_insumos_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remessas_insumos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas: {
        Row: {
          conforme: boolean | null
          critico: boolean
          execucao_id: string
          fora_do_limite: boolean
          foto: string | null
          id: string
          item_id: string | null
          lat: number | null
          lng: number | null
          observacao: string | null
          pergunta: string
          registrado_em: string
          registrado_por: string | null
          tipo: string
          valor_numero: number | null
          valor_texto: string | null
        }
        Insert: {
          conforme?: boolean | null
          critico?: boolean
          execucao_id: string
          fora_do_limite?: boolean
          foto?: string | null
          id?: string
          item_id?: string | null
          lat?: number | null
          lng?: number | null
          observacao?: string | null
          pergunta: string
          registrado_em?: string
          registrado_por?: string | null
          tipo?: string
          valor_numero?: number | null
          valor_texto?: string | null
        }
        Update: {
          conforme?: boolean | null
          critico?: boolean
          execucao_id?: string
          fora_do_limite?: boolean
          foto?: string | null
          id?: string
          item_id?: string | null
          lat?: number | null
          lng?: number | null
          observacao?: string | null
          pergunta?: string
          registrado_em?: string
          registrado_por?: string | null
          tipo?: string
          valor_numero?: number | null
          valor_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respostas_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "execucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      secretarias: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string
          organizacao_id: string | null
          prefeitura_id: string
          responsavel: string
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string
          organizacao_id?: string | null
          prefeitura_id: string
          responsavel?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string
          organizacao_id?: string | null
          prefeitura_id?: string
          responsavel?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secretarias_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secretarias_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_catalogo: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string
          id: string
          nome: string
          ordem: number
          preco: number | null
          price_id: string | null
          tipo: string
          unidade_cobranca: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string
          id?: string
          nome: string
          ordem?: number
          preco?: number | null
          price_id?: string | null
          tipo?: string
          unidade_cobranca?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          ordem?: number
          preco?: number | null
          price_id?: string | null
          tipo?: string
          unidade_cobranca?: string
          updated_at?: string
        }
        Relationships: []
      }
      suite_higienizacoes: {
        Row: {
          cloro_residual: number | null
          colaboradora_nome: string
          concluida_em: string | null
          created_at: string
          execucao_id: string | null
          hidro_dwell_segundos: number | null
          hidro_sanitizada: boolean
          id: string
          iniciada_em: string
          lat: number | null
          lng: number | null
          observacoes: string
          organizacao_id: string | null
          pin_colaboradora: string | null
          qr_validado: boolean
          status_final: string
          suite_id: string
          unit_id: string
        }
        Insert: {
          cloro_residual?: number | null
          colaboradora_nome?: string
          concluida_em?: string | null
          created_at?: string
          execucao_id?: string | null
          hidro_dwell_segundos?: number | null
          hidro_sanitizada?: boolean
          id?: string
          iniciada_em?: string
          lat?: number | null
          lng?: number | null
          observacoes?: string
          organizacao_id?: string | null
          pin_colaboradora?: string | null
          qr_validado?: boolean
          status_final?: string
          suite_id: string
          unit_id: string
        }
        Update: {
          cloro_residual?: number | null
          colaboradora_nome?: string
          concluida_em?: string | null
          created_at?: string
          execucao_id?: string | null
          hidro_dwell_segundos?: number | null
          hidro_sanitizada?: boolean
          id?: string
          iniciada_em?: string
          lat?: number | null
          lng?: number | null
          observacoes?: string
          organizacao_id?: string | null
          pin_colaboradora?: string | null
          qr_validado?: boolean
          status_final?: string
          suite_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suite_higienizacoes_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "execucoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suite_higienizacoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suite_higienizacoes_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "suites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suite_higienizacoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      suites: {
        Row: {
          ativo: boolean
          bloco: string
          categoria: string
          created_at: string
          id: string
          identificacao: string
          observacoes: string
          organizacao_id: string | null
          qr_token: string
          status: string
          status_atualizado_em: string
          tem_hidro: boolean
          tem_sauna: boolean
          ultima_higienizacao: string | null
          ultima_sanitizacao_hidro: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bloco?: string
          categoria?: string
          created_at?: string
          id?: string
          identificacao?: string
          observacoes?: string
          organizacao_id?: string | null
          qr_token?: string
          status?: string
          status_atualizado_em?: string
          tem_hidro?: boolean
          tem_sauna?: boolean
          ultima_higienizacao?: string | null
          ultima_sanitizacao_hidro?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bloco?: string
          categoria?: string
          created_at?: string
          id?: string
          identificacao?: string
          observacoes?: string
          organizacao_id?: string | null
          qr_token?: string
          status?: string
          status_atualizado_em?: string
          tem_hidro?: boolean
          tem_sauna?: boolean
          ultima_higienizacao?: string | null
          ultima_sanitizacao_hidro?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suites_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suites_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      treinamentos: {
        Row: {
          carga_horaria: number | null
          certificado_url: string | null
          colaboradora_id: string | null
          created_at: string
          funcao: string
          id: string
          instrutor: string
          organizacao_id: string | null
          participante: string
          pop_id: string | null
          realizado_em: string
          tema: string
          unit_id: string | null
          updated_at: string
          validade: string | null
        }
        Insert: {
          carga_horaria?: number | null
          certificado_url?: string | null
          colaboradora_id?: string | null
          created_at?: string
          funcao?: string
          id?: string
          instrutor?: string
          organizacao_id?: string | null
          participante: string
          pop_id?: string | null
          realizado_em: string
          tema: string
          unit_id?: string | null
          updated_at?: string
          validade?: string | null
        }
        Update: {
          carga_horaria?: number | null
          certificado_url?: string | null
          colaboradora_id?: string | null
          created_at?: string
          funcao?: string
          id?: string
          instrutor?: string
          organizacao_id?: string | null
          participante?: string
          pop_id?: string | null
          realizado_em?: string
          tema?: string
          unit_id?: string | null
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treinamentos_colaboradora_id_fkey"
            columns: ["colaboradora_id"]
            isOneToOne: false
            referencedRelation: "colaboradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamentos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamentos_pop_id_fkey"
            columns: ["pop_id"]
            isOneToOne: false
            referencedRelation: "pops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treinamentos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_pins: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          papel: string
          pin: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          papel?: string
          pin: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          papel?: string
          pin?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_pins_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          alvara_sanitario_expiracao: string | null
          alvara_sanitario_numero: string | null
          ambientes: Json
          ambientes_custom: Json
          bairro: string
          cidade: string
          conselho_rt: string | null
          created_at: string
          endereco: string | null
          foto_fachada: string | null
          id: string
          lat: number | null
          legacy_id: string | null
          lng: number | null
          locais: Json
          nome: string
          nome_completo: string | null
          pin: string
          prefeitura_id: string
          produtos: Json
          qtd_alunos: number | null
          qtd_colaboradores: number | null
          raio_metros: number
          responsavel: string
          responsavel_tecnico: string | null
          secretaria_id: string | null
          tipo: string
          uf: string
          updated_at: string
        }
        Insert: {
          alvara_sanitario_expiracao?: string | null
          alvara_sanitario_numero?: string | null
          ambientes?: Json
          ambientes_custom?: Json
          bairro?: string
          cidade?: string
          conselho_rt?: string | null
          created_at?: string
          endereco?: string | null
          foto_fachada?: string | null
          id?: string
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          locais?: Json
          nome: string
          nome_completo?: string | null
          pin: string
          prefeitura_id: string
          produtos?: Json
          qtd_alunos?: number | null
          qtd_colaboradores?: number | null
          raio_metros?: number
          responsavel?: string
          responsavel_tecnico?: string | null
          secretaria_id?: string | null
          tipo?: string
          uf?: string
          updated_at?: string
        }
        Update: {
          alvara_sanitario_expiracao?: string | null
          alvara_sanitario_numero?: string | null
          ambientes?: Json
          ambientes_custom?: Json
          bairro?: string
          cidade?: string
          conselho_rt?: string | null
          created_at?: string
          endereco?: string | null
          foto_fachada?: string | null
          id?: string
          lat?: number | null
          legacy_id?: string | null
          lng?: number | null
          locais?: Json
          nome?: string
          nome_completo?: string | null
          pin?: string
          prefeitura_id?: string
          produtos?: Json
          qtd_alunos?: number | null
          qtd_colaboradores?: number | null
          raio_metros?: number
          responsavel?: string
          responsavel_tecnico?: string | null
          secretaria_id?: string | null
          tipo?: string
          uf?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_prefeitura_id_fkey"
            columns: ["prefeitura_id"]
            isOneToOne: false
            referencedRelation: "prefeituras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_secretaria_id_fkey"
            columns: ["secretaria_id"]
            isOneToOne: false
            referencedRelation: "secretarias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      checklist_da_minha_org: {
        Args: { _checklist_id: string }
        Returns: boolean
      }
      execucao_aberta: { Args: { _execucao_id: string }; Returns: boolean }
      execucao_visivel: { Args: { _execucao_id: string }; Returns: boolean }
      gestor_acesso_execucao: {
        Args: { _execucao_id: string }
        Returns: boolean
      }
      gestor_acesso_prefeitura: {
        Args: { _prefeitura_id: string }
        Returns: boolean
      }
      gestor_acesso_unit: { Args: { _unit_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_logistica: { Args: { _organizacao_id: string }; Returns: boolean }
      is_master: { Args: { _user_id: string }; Returns: boolean }
      metricas_resumo: { Args: { _desde: string }; Returns: Json }
      minha_organizacao: { Args: { _user_id: string }; Returns: string }
      pedido_visivel: { Args: { _pedido_id: string }; Returns: boolean }
      pref_da_minha_org: { Args: { _prefeitura_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unit_da_minha_org: { Args: { _unit_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "gestor" | "operador" | "master"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestor", "operador", "master"],
    },
  },
} as const
