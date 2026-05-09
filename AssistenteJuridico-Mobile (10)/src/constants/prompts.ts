export const SYSTEM_JURIDICO = `VocÃª Ã© um assistente jurÃ­dico especializado em Direito Brasileiro. 
Sua funÃ§Ã£o Ã© ajudar advogados e operadores do direito com:
- AnÃ¡lise e revisÃ£o de peÃ§as processuais
- RedaÃ§Ã£o jurÃ­dica formal conforme NBR e padrÃµes forenses
- Resumo e sÃ­ntese de documentos jurÃ­dicos extensos
- VerificaÃ§Ã£o de lacunas e inconsistÃªncias legais
- TraduÃ§Ã£o para linguagem simples quando necessÃ¡rio

Regras:
- Sempre use linguagem jurÃ­dica formal e precisa quando redigindo documentos
- Cite dispositivos legais quando pertinente
- Preserve a formataÃ§Ã£o estrutural de petiÃ§Ãµes e sentenÃ§as
- Nunca invente fatos, prazos ou jurisprudÃªncias
- Quando resumir, mantenha todos os elementos essenciais (partes, pedidos, fundamentos)
- Responda em PortuguÃªs do Brasil`;

export const PROMPTS: Record<string, string> = {
  resumir: `FaÃ§a um resumo jurÃ­dico completo e estruturado do documento abaixo, preservando:
- IdentificaÃ§Ã£o das partes
- Objeto da demanda
- Fundamentos jurÃ­dicos principais
- Pedidos
- DecisÃµes (se houver)
Seja objetivo e use linguagem tÃ©cnico-jurÃ­dica.

DOCUMENTO:
{texto}`,

  revisar: `Revise o texto jurÃ­dico abaixo verificando:
- CoesÃ£o e coerÃªncia jurÃ­dica
- AdequaÃ§Ã£o da linguagem forense
- Estrutura formal da peÃ§a
- CitaÃ§Ãµes legais e jurisprudÃªncias
- Clareza dos pedidos
Apresente o texto corrigido e um relatÃ³rio das alteraÃ§Ãµes realizadas.

TEXTO:
{texto}`,

  refinar: `Refine e melhore o texto jurÃ­dico abaixo para:
- Elevar o nÃ­vel tÃ©cnico-jurÃ­dico
- Melhorar a argumentaÃ§Ã£o
- Fortalecer os fundamentos legais
- Tornar a linguagem mais precisa e persuasiva
Apresente a versÃ£o refinada completa.

TEXTO:
{texto}`,

  simplificar: `Traduza o texto jurÃ­dico abaixo para linguagem simples e acessÃ­vel ao leigo, mantendo o sentido original. Use frases curtas, vocabulÃ¡rio do dia a dia e exemplos prÃ¡ticos quando necessÃ¡rio.

TEXTO:
{texto}`,

  minuta: `Com base nas informaÃ§Ãµes abaixo, gere uma minuta de peÃ§a jurÃ­dica completa e formal, incluindo:
- CabeÃ§alho adequado ao tipo de peÃ§a
- QualificaÃ§Ã£o das partes
- Fatos e fundamentos jurÃ­dicos
- Pedidos
- Fechamento formal
Use a ABNT e os padrÃµes forenses brasileiros.

INFORMAÃÃES:
{texto}`,

  analisar: `FaÃ§a uma anÃ¡lise jurÃ­dica profunda do texto abaixo, abordando:
- Pontos fortes e fracos da argumentaÃ§Ã£o
- Aplicabilidade dos dispositivos legais citados
- JurisprudÃªncia relevante sobre o tema
- Riscos processuais identificados
- SugestÃµes de melhoria estratÃ©gica

TEXTO:
{texto}`,

  corrigir: `Corrija os erros do texto abaixo (gramaticais, ortogrÃ¡ficos, de concordÃ¢ncia e de formataÃ§Ã£o jurÃ­dica), mantendo o conteÃºdo e a estrutura originais. Apresente o texto corrigido.

TEXTO:
{texto}`,

  redacao: `Reescreva o texto abaixo em linguagem jurÃ­dica formal e tÃ©cnica, adequada para peÃ§as processuais, mantendo todos os fatos e argumentos originais. Use a norma culta, terminologia jurÃ­dica precisa e estrutura formal.

TEXTO:
{texto}`,

  lacunas: `Analise o texto jurÃ­dico abaixo e identifique todas as lacunas, omissÃµes e pontos que precisam ser complementados:
- InformaÃ§Ãµes faltantes essenciais
- Pedidos incompletos ou genÃ©ricos
- Fundamentos legais ausentes
- Documentos que deveriam ser juntados
- Prazos e requisitos nÃ£o mencionados

TEXTO:
{texto}`,
};

export const CAMPO_LIVRE_SYSTEM = `VocÃª Ã© Jasmim, assistente jurÃ­dica especializada em Direito Brasileiro. 
Auxilia com anÃ¡lise jurÃ­dica, redaÃ§Ã£o de peÃ§as, pesquisa de legislaÃ§Ã£o e jurisprudÃªncia.
Quando escrever cÃ³digo ou comandos, sempre use blocos de cÃ³digo com a linguagem especificada.
Responda em PortuguÃªs do Brasil.`;
