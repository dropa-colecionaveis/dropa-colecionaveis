#!/bin/bash

# Lista das rotas que precisam de dynamic = 'force-dynamic'
routes=(
  "src/app/api/user/inventory/route.ts"
  "src/app/api/user/recent-activity/route.ts"
  "src/app/api/user/daily-rewards/history/route.ts"
  "src/app/api/admin/unique-items-details/route.ts"
  "src/app/api/rankings/performance/route.ts"
  "src/app/api/test-session/route.ts"
  "src/app/api/user/collections/route.ts"
  "src/app/api/user/marketplace/listings/route.ts"
  "src/app/api/user/payments/route.ts"
)

for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    echo "Processing: $route"
    # Verificar se já tem a export
    if ! grep -q "export const dynamic" "$route"; then
      # Ler o arquivo
      temp_file=$(mktemp)
      
      # Flag para saber se já adicionou
      added=false
      
      while IFS= read -r line; do
        echo "$line" >> "$temp_file"
        
        # Se é uma linha de import e ainda não adicionou e a próxima não é import
        if [[ $line =~ ^import ]] && [ "$added" = false ]; then
          # Ler próxima linha para ver se ainda é import
          next_line=""
          if IFS= read -r next_line; then
            if [[ ! $next_line =~ ^import ]] && [[ ! $next_line =~ ^$ ]]; then
              # Próxima linha não é import nem vazia, adicionar dynamic antes dela
              echo "" >> "$temp_file"
              echo "export const dynamic = 'force-dynamic'" >> "$temp_file"
              echo "" >> "$temp_file"
              added=true
            fi
            echo "$next_line" >> "$temp_file"
          fi
        fi
      done < "$route"
      
      # Se ainda não adicionou (caso especial)
      if [ "$added" = false ]; then
        # Adicionar no final dos imports
        sed -i '/^import.*$/a\\nexport const dynamic = '\''force-dynamic'\''\n' "$temp_file"
      fi
      
      mv "$temp_file" "$route"
      echo "  ✅ Added dynamic export"
    else
      echo "  ⏭️  Already has dynamic export"
    fi
  else
    echo "  ❌ File not found: $route"
  fi
done
