<template>
  <div class="container">
    <h2 class="title">Descubra seu Amigo Secreto</h2>
    <div class="formBox">
      <label for="sorteioSelect">Escolha o Sorteio:</label>
      <select
        v-model="sorteioSelecionado"
        id="sorteioSelect"
        @change="carregarParticipantes"
      >
        <option disabled value="">Selecione um sorteio</option>
        <option v-for="s in sorteios" :key="s.id" :value="s">
          {{ s.nome }}
        </option>
      </select>

      <label for="participanteSelect">Escolha seu nome:</label>
      <select
        v-model="nome"
        id="participanteSelect"
        :disabled="!sorteioSelecionado"
      >
        <option disabled value="">Selecione seu nome</option>
        <option v-for="p in participantes" :key="p" :value="p">{{ p }}</option>
      </select>

      <label for="senhaInput">Digite sua senha:</label>
      <input
        id="senhaInput"
        type="password"
        v-model="senhaDigitada"
        :disabled="!nome || !sorteioSelecionado"
        placeholder="Senha recebida do admin"
      />

      <button
        @click="mostrarRaspadinha"
        :disabled="!nome || !senhaDigitada || !sorteioSelecionado"
      >
        Abrir Raspadinha
      </button>

      <div v-if="erro" class="error">{{ erro }}</div>
    </div>

    <div v-if="amigo" class="card">
      <div class="friendName">{{ nome }}</div>
      <div class="scratchContainer">
        <canvas
          ref="canvas"
          width="160"
          height="70"
          class="scratchCanvas"
        ></canvas>
      </div>
      <div v-show="revelado" class="friendName reveal">
        Seu amigo secreto é: {{ amigo }} 🎉
      </div>
    </div>
  </div>
</template>

<script>
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { onMounted, ref } from "vue";
import { db } from "../firebase";

export default {
  setup() {
    const sorteios = ref([]);
    const sorteioSelecionado = ref(null);
    const participantes = ref([]);
    const nome = ref("");
    const senhaDigitada = ref("");
    const amigo = ref(null);
    const revelado = ref(false);
    const canvas = ref(null);
    const erro = ref("");

    onMounted(async () => {
      try {
        const sorteiosCol = collection(db, "sorteios");
        const q = query(
          sorteiosCol,
          where("ativo", "==", true),
          orderBy("dataCriacao", "desc")
        );
        const sorteiosSnap = await getDocs(q);
        sorteios.value = sorteiosSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (e) {
        erro.value = "Erro ao carregar sorteios: " + e.message;
      }
    });

    async function carregarParticipantes() {
      nome.value = "";
      amigo.value = null;
      revelado.value = false;
      erro.value = "";
      senhaDigitada.value = "";
      participantes.value = [];

      if (!sorteioSelecionado.value) return;

      try {
        // ✅ Carrega só os nomes dos participantes (sem senhas)
        const resultadosCol = collection(
          db,
          "sorteios",
          sorteioSelecionado.value.id,
          "resultados"
        );
        const resultadosSnap = await getDocs(resultadosCol);
        participantes.value = resultadosSnap.docs
          .map((doc) => doc.data().participante)
          .sort();
      } catch (e) {
        erro.value = "Erro ao carregar participantes: " + e.message;
      }
    }

    function iniciarRaspadinha() {
      const cvs = canvas.value;
      const ctx = cvs.getContext("2d", { willReadFrequently: true });
      ctx.fillStyle = "#b7b7b7";
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      ctx.globalCompositeOperation = "destination-out";

      let isDrawing = false;

      cvs.addEventListener("mousedown", () => (isDrawing = true));
      cvs.addEventListener("mouseup", () => (isDrawing = false));
      cvs.addEventListener("mouseleave", () => (isDrawing = false));
      cvs.addEventListener("mousemove", (evt) => {
        if (!isDrawing) return;
        const rect = cvs.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
        checkReveal();
      });

      cvs.addEventListener("touchstart", (e) => {
        e.preventDefault();
        isDrawing = true;
        const rect = cvs.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
      });

      cvs.addEventListener("touchend", (e) => {
        e.preventDefault();
        isDrawing = false;
      });

      cvs.addEventListener("touchcancel", (e) => {
        e.preventDefault();
        isDrawing = false;
      });

      cvs.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const rect = cvs.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
        checkReveal();
      });

      function checkReveal() {
        const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        let clearedPixels = 0;
        for (let i = 3; i < imgData.data.length; i += 4) {
          if (imgData.data[i] === 0) clearedPixels++;
        }
        const percent = (clearedPixels / (cvs.width * cvs.height)) * 100;
        if (percent > 50) {
          revelado.value = true;
          cvs.style.display = "none";
        }
      }
    }

    async function mostrarRaspadinha() {
      erro.value = "";
      amigo.value = null;
      revelado.value = false;

      if (!nome.value || !sorteioSelecionado.value || !senhaDigitada.value) {
        erro.value = "Preencha todos os campos!";
        return;
      }

      try {
        // ✅ VERIFICAÇÃO SEGURA: nome + senha
        const resultadoDoc = doc(
          db,
          "sorteios",
          sorteioSelecionado.value.id,
          "resultados",
          nome.value
        );
        const resultadoSnap = await getDoc(resultadoDoc);

        if (!resultadoSnap.exists()) {
          erro.value = "Nome não encontrado no sorteio.";
          return;
        }

        const dados = resultadoSnap.data();
        if (dados.senha !== senhaDigitada.value) {
          erro.value = "Senha incorreta!";
          return;
        }

        amigo.value = dados.amigoSorteado;
        setTimeout(iniciarRaspadinha, 100);
      } catch (e) {
        erro.value = "Erro ao buscar dados: " + e.message;
      }
    }

    return {
      sorteios,
      sorteioSelecionado,
      participantes,
      nome,
      senhaDigitada,
      amigo,
      revelado,
      canvas,
      erro,
      carregarParticipantes,
      mostrarRaspadinha,
    };
  },
};
</script>

<style scoped>
.container {
  max-width: 160px;
  margin: 0 auto 22px auto;
  padding: 8px;
  background: #24262b;
  border-radius: 16px;
  box-shadow: 0 2.5px 12px #0003;
}
.title {
  text-align: center;
  color: #fff;
  font-size: 1.05em;
  font-weight: 700;
  margin: 10px 0 10px 0;
}
.formBox {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0 auto 10px auto;
  max-width: 140px;
}
select,
input[type="password"] {
  width: 100%;
  max-width: 140px;
  margin: 0 auto;
  padding: 6px 10px;
  font-size: 0.94em;
  border-radius: 6px;
  border: 2px solid #59b7fa;
  background: #f6faff;
  color: #23272b;
  box-sizing: border-box;
  font-weight: 500;
  margin-bottom: 3px;
}
button,
.error {
  max-width: 140px;
  margin: 7px auto 0 auto;
  font-size: 0.92em;
  border-radius: 8px;
  padding: 8px 0;
}
button {
  background: #59b7fa;
  color: #fff;
  font-weight: bold;
  border: none;
  box-shadow: 0 2px 7px #438ef725;
  cursor: pointer;
  transition: background 0.2s;
}
button:disabled {
  background: #badff7;
  color: #575757;
  cursor: not-allowed;
  box-shadow: none;
}
button:hover:not(:disabled) {
  background: #438ef7;
  box-shadow: 0 2px 14px #438ef7a1;
}
.card {
  width: 80%;
  max-width: 140px;
  margin: 18px auto 10px auto;
  background: linear-gradient(115deg, #292f38 35%, #16171c 120%);
  border: 1.4px solid #59b7fa;
  border-radius: 9px;
  box-shadow: 0 2px 8px #4371;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 7px 12px 7px;
  color: #fff;
  position: relative;
  overflow: hidden;
}
.friendName {
  font-size: 0.95em;
  font-weight: bold;
  color: #23272b;
  background: #f1f2f5;
  border-radius: 5px;
  padding: 5px 10px;
  margin-bottom: 6px;
  margin-top: 3px;
  box-shadow: 0px 2px 8px #f2f2f2de;
  text-align: center;
}
.friendName.reveal {
  background: #d7fada;
  color: #186c19;
  box-shadow: 0 0 7px #d7fada;
  font-size: 0.97em;
}
.scratchContainer {
  width: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 6px;
}
.scratchCanvas {
  width: 80%;
  max-width: 100px;
  height: 50px;
  border-radius: 8px;
  box-shadow: 0 1px 7px #0002;
  background: repeating-linear-gradient(33deg, #c9e9ff 0 21px, #fff 21px 42px);
  border: 1.2px solid #59b7fa;
  margin: 0 auto;
  display: block;
}
.error {
  color: #ff4b5c;
  background: #ffd6e0;
  border-radius: 2.5px;
  padding: 3px 6px;
  max-width: 130px;
  text-align: center;
  font-weight: bold;
  margin-top: 5px;
}
@media (max-width: 600px) {
  .container,
  .card,
  .scratchCanvas,
  select,
  input[type="password"],
  button,
  .error {
    max-width: 97vw !important;
    font-size: 0.94em !important;
    min-width: 0 !important;
  }
  .card {
    margin-bottom: 18px !important;
  }
  div[style*="max-width: 200px"] {
    max-width: 96vw !important;
    width: 96vw !important;
    margin-left: auto !important;
    margin-right: auto !important;
    box-sizing: border-box !important;
    padding-left: 2vw !important;
    padding-right: 2vw !important;
  }
}
</style>
