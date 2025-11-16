<template>
  <div class="admin-container">
    <h2>Área do Admin - Criar Sorteio</h2>
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
      <input v-model="nomeSorteio" placeholder="Nome do Sorteio" />
      <textarea
        v-model="participantes"
        placeholder="Digite os nomes separados por vírgula"
        rows="3"
      ></textarea>
      <button @click="criarSorteio">Criar Sorteio</button>
      <p v-if="mensagem">{{ mensagem }}</p>
      <button
        @click="logout"
        style="margin-top: 10px; background-color: #ccc; color: #333"
      >
        Sair do Admin
      </button>
      <div v-if="senhasGeradas.length">
        <h3>Senhas dos Participantes</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Senha</th>
              <th>Copiar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in senhasGeradas" :key="p.nome">
              <td>{{ p.nome }}</td>
              <td style="font-family: monospace">{{ p.senha }}</td>
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
    </div>
  </div>
</template>

<script>
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
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

    function validarSenha() {
      if (senha.value === "123") {
        logado.value = true;
        erroSenha.value = "";
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

    function copiarSenha(senha) {
      navigator.clipboard.writeText(senha);
      mensagem.value = "Senha copiada!";
      setTimeout(() => (mensagem.value = ""), 2000);
    }

    function baixarSenhasCSV() {
      let csv = "Nome,Senha\n";
      senhasGeradas.value.forEach((p) => {
        csv += `"${p.nome}","${p.senha}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "senhas_amigo_secreto.csv";
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
        .filter((x) => !!x);

      if (participantesArr.length < 2) {
        mensagem.value = "Informe ao menos 2 participantes";
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

          senhasGeradas.value.push({ nome: p, senha: senhaGerada });
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
      validarSenha,
      logout,
      criarSorteio,
      senhasGeradas,
      copiarSenha,
      baixarSenhasCSV,
    };
  },
};
</script>

<style scoped>
.admin-container {
  max-width: 300px;
  margin: 32px auto 0 auto;
  padding: 25px;
  box-sizing: border-box;
}
input,
textarea {
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
textarea:focus {
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
button:hover {
  background-color: #ff1f38;
  box-shadow: 0 2px 7px rgba(255, 31, 56, 0.3);
}
button[style] {
  margin-top: 10px;
  background-color: #ccc;
  color: #333;
  font-size: 1rem;
  padding: 8px 0;
}
p {
  font-size: 0.9rem;
  margin-top: 10px;
  line-height: 1.4;
}
div[v-if] {
  font-weight: 700;
  font-size: 0.9rem;
  margin-top: 11px;
  color: #d32f2f;
}
h2 {
  font-size: 1.2rem;
  margin-bottom: 10px;
  text-align: center;
}
h3 {
  font-size: 1rem;
  margin-top: 18px;
  margin-bottom: 5px;
  color: #444;
  text-align: center;
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
  border-bottom: 1px solid #eee;
  padding: 5px 4px;
}
th {
  background: #000000;
}
@media (max-width: 500px) {
  .admin-container {
    max-width: 98vw !important;
    margin: 16px auto 0 auto !important;
    padding: 5vw 3vw !important;
  }
  /* Outros ajustes de responsividade podem ser adicionados aqui */
}
</style>
