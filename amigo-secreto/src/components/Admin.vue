<template>
  <div class="admin-container">
    <h2>Área do Admin - Gerenciar Sorteios</h2>
    <div v-if="!logado">
      <input
        type="password"
        v-model="senha"
        placeholder="Digite a senha de admin"
      />
      <button @click="validarSenha">Entrar</button>
      <p v-if="erroSenha" style="color: red">{{ erroSenha }}</p>
    </div>
    <div v-else>
      <!-- Formulário para criar novo sorteio -->
      <div class="form-section">
        <h3>Criar Novo Sorteio</h3>
        <input v-model="nomeSorteio" placeholder="Nome do Sorteio" />
        <textarea
          v-model="participantes"
          placeholder="Digite os nomes separados por vírgula"
          rows="3"
        ></textarea>
        <button @click="criarSorteio">Criar Sorteio</button>
      </div>

      <!-- Listar sorteios existentes -->
      <div class="form-section">
        <h3>Sorteios Existentes</h3>
        <button @click="carregarSorteios" :disabled="carregandoSorteios">
          {{ carregandoSorteios ? "Carregando..." : "Listar Sorteios" }}
        </button>
        <div v-if="sorteios.length" class="sorteios-list">
          <select
            v-model="sorteioSelecionado"
            @change="visualizarSorteio(sorteioSelecionado)"
          >
            <option value="">Selecione um sorteio para visualizar</option>
            <option v-for="s in sorteios" :key="s.id" :value="s.id">
              {{ s.nome }} ({{ formatarData(s.dataCriacao) }})
            </option>
          </select>
        </div>
      </div>

      <!-- Senhas do sorteio selecionado -->
      <div v-if="senhasGeradas.length">
        <h3 v-if="sorteioSelecionado">
          Senhas: {{ sorteios.find((s) => s.id === sorteioSelecionado)?.nome }}
        </h3>
        <h3 v-else>Senhas dos Participantes</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Senha</th>
              <th>Amigo Sorteado</th>
              <th>Copiar Senha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in senhasGeradas" :key="p.nome">
              <td>{{ p.nome }}</td>
              <td style="font-family: monospace">{{ p.senha }}</td>
              <td>{{ p.amigoSorteado }}</td>
              <td>
                <button @click="copiarSenha(p.senha)">Copiar</button>
              </td>
            </tr>
          </tbody>
        </table>
        <button
          @click="baixarSenhasCSV"
          style="margin-top: 8px; background: #59b7fa; color: #fff"
        >
          Baixar CSV das Senhas
        </button>
      </div>

      <!-- Mensagens e logout -->
      <p
        v-if="mensagem"
        :style="mensagem.includes('sucesso') ? 'color: green' : 'color: red'"
      >
        {{ mensagem }}
      </p>
      <button
        @click="logout"
        style="margin-top: 10px; background-color: #ccc; color: #333"
      >
        Sair do Admin
      </button>
    </div>
  </div>
</template>

<script>
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
} from "firebase/firestore";
import { ref } from "vue";
import { db } from "../firebase";

export default {
  setup() {
    const senha = ref("");
    const logado = ref(false);
    const erroSenha = ref("");
    const nomeSorteio = ref("");
    const participantes = ref("");
    const mensagem = ref("");
    const senhasGeradas = ref([]);
    const sorteios = ref([]);
    const sorteioSelecionado = ref(null);
    const carregandoSorteios = ref(false);

    function validarSenha() {
      if (senha.value === "123") {
        logado.value = true;
        erroSenha.value = "";
        carregarSorteios(); // Carrega sorteios automaticamente ao logar
      } else {
        erroSenha.value = "Senha incorreta";
      }
    }

    function logout() {
      logado.value = false;
      senha.value = "";
      mensagem.value = "";
      nomeSorteio.value = "";
      participantes.value = "";
      senhasGeradas.value = [];
      sorteios.value = [];
      sorteioSelecionado.value = null;
    }

    function formatarData(data) {
      if (!data) return "Data inválida";
      return data.toDate
        ? data.toDate().toLocaleDateString("pt-BR")
        : "Sem data";
    }

    async function carregarSorteios() {
      carregandoSorteios.value = true;
      mensagem.value = "Carregando sorteios...";

      try {
        const q = query(collection(db, "sorteios"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          sorteios.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          carregandoSorteios.value = false;
          if (snapshot.empty) {
            mensagem.value = "Nenhum sorteio encontrado.";
          }
        });
        // Unsubscribe será gerenciado pelo Vue automaticamente
      } catch (e) {
        mensagem.value = "Erro ao carregar sorteios: " + e.message;
        carregandoSorteios.value = false;
      }
    }

    async function visualizarSorteio(sorteioId) {
      if (!sorteioId) {
        senhasGeradas.value = [];
        return;
      }

      try {
        mensagem.value = "Carregando detalhes do sorteio...";
        senhasGeradas.value = [];

        const resultadosRef = collection(
          db,
          "sorteios",
          sorteioId,
          "resultados"
        );
        const snapshot = await getDocs(resultadosRef);

        snapshot.forEach((doc) => {
          senhasGeradas.value.push({
            nome: doc.id,
            ...doc.data(),
          });
        });

        mensagem.value = `Sorteio carregado com sucesso! ${senhasGeradas.value.length} participantes.`;
      } catch (e) {
        mensagem.value = "Erro ao carregar sorteio: " + e.message;
      }
    }

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    function criarSorteioCorrigido(participantesArr) {
      let valido = false;
      let resultado = [];
      while (!valido) {
        resultado = participantesArr.slice();
        shuffle(resultado);
        valido = true;
        for (let i = 0; i < participantesArr.length; i++) {
          if (participantesArr[i] === resultado[i]) {
            valido = false;
            break;
          }
        }
      }
      return resultado;
    }

    function gerarSenhaAleatoria(tamanho = 8) {
      const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let senha = "";
      for (let i = 0; i < tamanho; i++) {
        senha += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return senha;
    }

    function copiarSenha(senhaParam) {
      navigator.clipboard.writeText(senhaParam);
      mensagem.value = "Senha copiada!";
      setTimeout(() => (mensagem.value = ""), 2000);
    }

    function baixarSenhasCSV() {
      let csv = "Nome,Senha,Amigo Sorteado\n";
      senhasGeradas.value.forEach((p) => {
        csv += `"${p.nome}","${p.senha}","${p.amigoSorteado}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `senhas_${sorteioSelecionado.value || "sorteio"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    async function criarSorteio() {
      if (!nomeSorteio.value.trim()) {
        mensagem.value = "Informe um nome para o sorteio";
        return;
      }

      let participantesArr = participantes.value
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x.length > 1);

      if (participantesArr.length < 2) {
        mensagem.value = "Informe ao menos 2 participantes únicos";
        return;
      }

      if (new Set(participantesArr).size !== participantesArr.length) {
        mensagem.value = "Nomes duplicados não são permitidos";
        return;
      }

      mensagem.value = "Criando sorteio...";
      senhasGeradas.value = [];

      const resultados = criarSorteioCorrigido(participantesArr);

      try {
        const sorteioRef = await addDoc(collection(db, "sorteios"), {
          nome: nomeSorteio.value.trim(),
          ativo: true,
          dataCriacao: new Date(),
        });

        for (let i = 0; i < participantesArr.length; i++) {
          const p = participantesArr[i];
          const amigo = resultados[i];
          const senhaGerada = gerarSenhaAleatoria();

          await setDoc(doc(sorteioRef, "resultados", p), {
            participante: p,
            amigoSorteado: amigo,
            senha: senhaGerada,
          });

          senhasGeradas.value.push({
            nome: p,
            senha: senhaGerada,
            amigoSorteado: amigo,
          });
        }
        mensagem.value = "Sorteio criado com sucesso!";
        nomeSorteio.value = "";
        participantes.value = "";
      } catch (e) {
        mensagem.value = "Erro ao criar sorteio: " + e.message;
      }
    }

    return {
      senha,
      logado,
      erroSenha,
      nomeSorteio,
      participantes,
      mensagem,
      senhasGeradas,
      sorteios,
      sorteioSelecionado,
      carregandoSorteios,
      validarSenha,
      logout,
      criarSorteio,
      carregarSorteios,
      visualizarSorteio,
      copiarSenha,
      baixarSenhasCSV,
    };
  },
};
</script>

<style scoped>
.admin-container {
  max-width: 600px;
  margin: 32px auto 0 auto;
  padding: 25px;
  box-sizing: border-box;
}
.form-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
input,
textarea,
select {
  margin: 10px 0;
  width: 100%;
  padding: 10px 12px;
  font-size: 1rem;
  border-radius: 8px;
  border: 2px solid #ccc;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  resize: vertical;
}
input::placeholder,
textarea::placeholder {
  font-size: 0.9rem;
  opacity: 0.6;
}
input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #ff4b5c;
  box-shadow: 0 0 5px #ff4b5c;
}
button {
  margin-top: 16px;
  background-color: #ff4b5c;
  border: none;
  color: white;
  padding: 12px 0;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  transition: background 0.3s, box-shadow 0.3s;
}
button:hover:not([disabled]) {
  background-color: #ff1f38;
  box-shadow: 0 2px 7px rgba(255, 31, 56, 0.3);
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
button[style] {
  margin-top: 10px;
  background-color: #ccc !important;
  color: #333;
  font-size: 1rem;
  padding: 8px 0;
}
p {
  font-size: 0.9rem;
  margin-top: 10px;
  line-height: 1.4;
}
h2 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  text-align: center;
  color: #333;
}
h3 {
  font-size: 1.1rem;
  margin-top: 18px;
  margin-bottom: 10px;
  color: #444;
  text-align: center;
}
.sorteios-list {
  margin-top: 15px;
}
table {
  width: 100%;
  background: #000000;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 8px #0001;
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #fff;
}
th,
td {
  border-bottom: 1px solid #333;
  padding: 8px 6px;
  text-align: left;
}
th {
  background: #1a1a1a;
  font-weight: bold;
}
@media (max-width: 500px) {
  .admin-container {
    max-width: 98vw !important;
    margin: 16px auto 0 auto !important;
    padding: 5vw 3vw !important;
  }
  table {
    font-size: 0.8rem;
  }
  th,
  td {
    padding: 6px 4px;
  }
}
</style>
