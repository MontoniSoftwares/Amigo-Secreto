<template>
  <div style="max-width: 200px; margin: 0 auto">
    <h2 style="text-align: center; margin-bottom: 11px">
      Descubra seu Amigo Secreto
    </h2>

    <label for="sorteioSelect">Escolha o Sorteio:</label>
    <select
      v-model="sorteioSelecionado"
      id="sorteioSelect"
      @change="carregarParticipantes"
    >
      <option disabled value="">Selecione um sorteio</option>
      <option v-for="s in sorteios" :key="s.id" :value="s">{{ s.nome }}</option>
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
      style="margin-top: 8.5px"
    >
      Abrir Raspadinha
    </button>

    <div v-if="amigo" class="card">
      <div class="friendName">{{ nome }}</div>
      <div class="scratchContainer">
        <canvas
          ref="canvas"
          width="145"
          height="90"
          class="scratchCanvas"
        ></canvas>
      </div>
      <div v-show="revelado" class="friendName">
        Seu amigo secreto é: {{ amigo }} 🎉
      </div>
    </div>

    <div v-if="erro" class="error">{{ erro }}</div>
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

    // Carrega sorteios ativos ao montar o componente
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

    // Carrega participantes do sorteio selecionado
    async function carregarParticipantes() {
      nome.value = "";
      amigo.value = null;
      revelado.value = false;
      erro.value = "";
      senhaDigitada.value = "";
      participantes.value = [];
      if (!sorteioSelecionado.value) return;
      try {
        const resultadosCol = collection(
          db,
          "sorteios",
          sorteioSelecionado.value.id,
          "resultados"
        );
        const resultadosSnap = await getDocs(resultadosCol);
        participantes.value = resultadosSnap.docs.map(
          (doc) => doc.data().participante
        );
      } catch (e) {
        erro.value = "Erro ao carregar participantes: " + e.message;
      }
    }

    // Inicializa a raspadinha no canvas
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
        ctx.arc(x, y, 20, 0, Math.PI * 2);
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

    // Mostra raspadinha verificando senha e amigo secreto
    async function mostrarRaspadinha() {
      erro.value = "";
      amigo.value = null;
      revelado.value = false;

      if (!nome.value || !sorteioSelecionado.value || !senhaDigitada.value) {
        erro.value = "Preencha todos os campos!";
        return;
      }
      try {
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
select,
input[type="password"] {
  width: 100%;
  padding: 9px 12px;
  font-size: 0.75rem;
  border-radius: 7px;
  border: 1px solid #59b7fa;
  box-sizing: border-box;
  margin-top: 4px;
  margin-bottom: 6px;
  transition: border-color 0.3s, box-shadow 0.3s;
  appearance: none;
  background: #fff;
  color: #23272b;
  font-weight: 500;
}

button {
  margin-top: 8.5px;
  padding: 9.5px 14px;
  font-size: 0.9rem;
  border-radius: 10px;
  background-color: #59b7fa;
  border: none;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 1px 7px rgba(44, 53, 50, 0.07);
  letter-spacing: 1px;
}

button:hover:not(:disabled) {
  background-color: #438ef7;
  box-shadow: 0 1px 12px #438ef7a1;
}

button:disabled {
  background-color: #badff7;
  color: #575757;
  cursor: not-allowed;
  box-shadow: none;
}

.card {
  width: 180px;
  height: 220px;
  background: linear-gradient(115deg, #23272b 20%, #030303 120%);
  border: 1px solid #59b7fa;
  border-radius: 9px;
  box-shadow: 0 2px 11px rgba(50, 70, 140, 0.19);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 9px;
  margin-top: 10px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
}

.friendName {
  font-weight: bold;
  font-size: 0.625em;
  color: #000000;
  margin-top: 9.5px;
  margin-bottom: 5px;
  background: #f1f2f5;
  border-radius: 4px;
  padding: 5px 7px;
  box-shadow: 0px 1.5px 7.5px rgb(234, 238, 237);
  text-align: center;
}

.scratchContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 110px;
  margin: 0;
  position: relative;
}

.scratchCanvas {
  width: 145px;
  height: 90px;
  border-radius: 7px;
  box-shadow: 1px 1px 10px rgb(249, 250, 250);
  background: repeating-linear-gradient(33deg, #c9e9ff 0 40px, #fff 40px 40px);
  border: 1px dashed #59b7fa;
  display: block;
  margin: 0 auto;
}

.error {
  color: #ff4b5c;
  margin-top: 6px;
  font-weight: bold;
  text-align: center;
  background: #ffd6e0;
  border-radius: 3.5px;
  padding: 2px 4px;
}

@media (max-width: 600px) {
  div[style] {
    max-width: 90vw !important;
    padding: 0 5vw !important;
  }
  .card {
    width: 90vw !important;
    height: auto !important;
  }
  .scratchCanvas {
    width: 90vw !important;
    height: auto !important;
  }
  button {
    font-size: 0.85rem !important;
    padding: 8px 12px !important;
  }
  select,
  input[type="password"] {
    font-size: 0.7rem !important;
    padding: 8px 10px !important;
  }
}
</style>
