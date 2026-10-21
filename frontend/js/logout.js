document.querySelectorAll("[data-logout]").forEach((botao) => {
    botao.addEventListener("click", async () => {
        botao.disabled = true;
        try {
            const resposta = await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (!resposta.ok) throw new Error("Falha ao sair");
            window.location.replace("/pages/login.html");
        } catch {
            window.alert("Não foi possível concluir a solicitação. Tente novamente.");
            botao.disabled = false;
        }
    });
});
