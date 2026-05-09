import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { prisma } from './db'
import { ensureDatabaseSchema } from './db-patch'

type SeedArticle = {
  slug: string
  title: string
  subtitle: string
  category: string
  author: string
  source: string
  sourceUrl?: string
  readTime: number
  publishedAt: string
  tags: string[]
  coverImage: string
  content: string
}

const articles: SeedArticle[] = [
  {
    slug: 'historia-do-basquete-do-ginasio-ao-rio-grande-do-sul',
    title: 'A história do basquete: do ginásio de Springfield ao Rio Grande do Sul',
    subtitle:
      'Em 1891, um professor canadense inventou o jogo para o inverno. Mais de 130 anos depois, o esporte move paixões em todo o Rio Grande do Sul.',
    category: 'Conhecimento',
    author: 'Redação FGB',
    source: 'FGB',
    readTime: 6,
    publishedAt: '2026-04-01T12:00:00Z',
    tags: ['historia', 'basquete', 'brasil', 'fgb', 'rio grande do sul'],
    coverImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Basketball_through_hoop.jpg/1280px-Basketball_through_hoop.jpg',
    content: `
<h2>O início de tudo: uma cesta de pêssego e 13 regras</h2>
<p>Era dezembro de 1891. O professor canadense <strong>James Naismith</strong>, lecionando na Escola de Springfield, nos Estados Unidos, precisava de uma atividade para manter seus alunos ativos durante o frio do inverno. Em menos de uma hora, escreveu 13 regras e pediu que o zelador do ginásio instalasse duas cestas de pêssego nas extremidades da quadra. Estava inventado o basquetebol.</p>

<p>O primeiro jogo aconteceu com 18 alunos divididos em dois times de nove. Não havia dribble, não havia time de jogo e a bola precisava ser recuperada manualmente da cesta a cada ponto marcado — afinal, o fundo ainda não havia sido recortado. Mas a essência estava ali: movimentação, arremesso e equipe.</p>

<h2>O esporte chega ao Brasil</h2>
<p>O Brasil foi um dos primeiros países do mundo a conhecer o basquete. Em <strong>1894</strong>, o norte-americano Augusto Shaw, formado em Yale, trouxe o esporte na bagagem ao aceitar um convite para lecionar no Mackenzie College, em São Paulo. Três anos depois, a modalidade já se espalhava pelo Rio de Janeiro e por Minas Gerais.</p>

<p>O primeiro torneio organizado foi o <strong>Campeonato Paulista de 1924</strong>. Em 1933, nasceu a Federação Brasileira de Basketball — hoje Confederação Brasileira de Basketball (CBB) —, consolidando a organização nacional do esporte.</p>

<h2>A Era de Ouro brasileira</h2>
<p>Os anos 1950 e 1960 são considerados o período áureo do basquete brasileiro. A Seleção conquistou o <strong>título mundial em 1959 e 1963</strong>, além das medalhas de bronze olímpico em 1948, 1960 e 1964. O Brasil se transformou em potência mundial.</p>

<p>No feminino, a trajetória também é gloriosa: o Brasil conquistou o <strong>Campeonato Mundial de 1994</strong> na Austrália e a medalha de prata olímpica em Atlanta 1996. Nomes como <strong>Hortência, Paula e Janeth</strong> tornaram-se ícones nacionais.</p>

<h2>O basquete chega ao Rio Grande do Sul</h2>
<p>O Rio Grande do Sul tem uma relação histórica com o basquete. Em <strong>1934 e 1935</strong>, equipes gaúchas foram bicampeãs nacionais nos torneios promovidos pela CBD em São Paulo — naquela época, as viagens eram feitas de trem, quatro dias e quatro noites até a capital paulista.</p>

<p>Em <strong>18 de abril de 1952</strong>, foi fundada oficialmente a <strong>Federação Gaúcha de Basketball (FGB)</strong> em Porto Alegre, pelo presidente José Carlos Daut, com apoio de 22 clubes fundadores — entre eles Grêmio, Internacional, SOGIPA e times de Santa Maria, Rio Grande e Lajeado.</p>

<p>Hoje, a FGB organiza campeonatos nas categorias Sub-12, Sub-13, Sub-14, Sub-15, Sub-16, Sub-17, Sub-19, Adulto e 3x3, levando o basquete a ginásios em todo o estado e revelando talentos que chegam às seleções brasileiras.</p>

<h2>O basquete hoje: crescimento e tecnologia</h2>
<p>Em 2026, a CBB apresentou o maior calendário da história do basquete brasileiro, reunindo competições nacionais, estaduais e internacionais ao longo de toda a temporada. O NBB — Novo Basquete Brasil — chegou à sua 18ª edição com <strong>20 clubes</strong>, recorde histórico, incluindo o <strong>União Corinthians (RS)</strong> e o <strong>Caxias do Sul Basquete</strong> entre os representantes gaúchos na elite nacional.</p>

<p>O basquete que começou com uma cesta de pêssego em Springfield agora move arenas, forma atletas e une comunidades em todo o Rio Grande do Sul. E a FGB está no centro dessa história.</p>
`.trim(),
  },
  {
    slug: 'nbb-2025-2026-o-maior-da-historia',
    title:
      'NBB 2025/26: o maior campeonato de basquete do Brasil está acontecendo agora',
    subtitle:
      'Com 20 clubes, dois times gaúchos e playoffs emocionantes, a 18ª edição do NBB CAIXA escreve um novo capítulo na história do basquete nacional.',
    category: 'Notícias',
    author: 'Redação FGB',
    source: 'LNB / CBB',
    sourceUrl: 'https://lnb.com.br',
    readTime: 5,
    publishedAt: '2026-04-15T12:00:00Z',
    tags: ['nbb', 'basquete brasileiro', 'gaucho', 'caxias', 'corinthians', '2026'],
    coverImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Basketball_in_the_air.jpg/1280px-Basketball_in_the_air.jpg',
    content: `
<h2>Um recorde histórico</h2>
<p>A temporada 2025/26 do <strong>NBB CAIXA</strong> — Novo Basquete Brasil — entrou para a história antes mesmo da bola subir. Pela primeira vez em 18 edições, o campeonato reuniu <strong>20 clubes</strong> representando oito estados brasileiros, confirmando o crescimento sólido e contínuo do basquete nacional.</p>

<p>"É um momento de muita alegria para a LNB. O crescimento sólido que o NBB CAIXA vem apresentando é um dos sinais de que o basquete vem crescendo", disse Rodrigo Montoro, presidente da Liga Nacional de Basquete.</p>

<h2>Os times gaúchos na elite</h2>
<p>O Rio Grande do Sul tem dois representantes nesta edição histórica: o <strong>Caxias do Sul Basquete</strong>, tradicional do estadual gaúcho com sete títulos, e o <strong>CEISC União Corinthians</strong>, de Santa Cruz do Sul, que segue firmando o nome do estado no cenário nacional.</p>

<p>A presença gaúcha na elite do basquete nacional é motivo de orgulho e espelha o trabalho de base desenvolvido pela FGB ao longo das décadas, formando atletas que chegam às melhores equipes do país.</p>

<h2>O formato da temporada</h2>
<p>As 20 equipes disputam a fase regular em turno e returno — 38 rodadas no total. As <strong>16 melhores campanhas</strong> avançam para os playoffs, que contam com séries melhor de cinco jogos desde as oitavas até a grande final.</p>

<p>Uma novidade importante desta temporada: o <strong>sistema de rebaixamento</strong>. As duas equipes com piores campanhas descem para a Liga Ouro, que funciona como a segunda divisão do basquete brasileiro, com o campeão garantindo o acesso de volta.</p>

<h2>Os playoffs em 2026</h2>
<p>Nas oitavas de final, jogos emocionantes marcaram o início da fase eliminatória. O <strong>Brusque Basquete</strong> surpreendeu ao vencer o Fluminense na prorrogação, forçando o jogo decisivo da série. O CAIXA/Brasília, com recorde de público na Arena Nilson Nelson, venceu o Flamengo em duelo dramático nas semifinais.</p>

<p>O <strong>Sesi Franca</strong>, tetracampeão, entra nos playoffs como um dos favoritos ao título após dominar a temporada regular. A disputa pelo maior troféu do basquete brasileiro segue intensa.</p>

<h2>Onde assistir</h2>
<p>O NBB 2025/26 é transmitido pela <strong>N Sports</strong> (TV fechada) e pelos canais oficiais da LNB no YouTube. Acompanhe os resultados em tempo real pelo aplicativo da Liga Nacional de Basquete e torcendo pelos times gaúchos na elite do basquete brasileiro.</p>
`.trim(),
  },
  {
    slug: 'basquete-3x3-tudo-sobre-a-modalidade-olimpica',
    title:
      'Basquete 3x3: tudo sobre a modalidade olímpica que nasceu nas ruas',
    subtitle:
      'Das quadras abertas dos anos 1980 aos Jogos Olímpicos de Tóquio — e às competições da FGB no Rio Grande do Sul.',
    category: 'Conhecimento',
    author: 'Redação FGB',
    source: 'FGB',
    readTime: 7,
    publishedAt: '2026-04-20T12:00:00Z',
    tags: ['3x3', 'olimpiadas', 'fiba', 'regras', 'basquete', 'fgb'],
    coverImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/3x3_Basketball_-_2018_Youth_Olympic_Games_-_Mixed_Final_-_009.jpg/1280px-3x3_Basketball_-_2018_Youth_Olympic_Games_-_Mixed_Final_-_009.jpg',
    content: `
<h2>Das ruas às Olimpíadas</h2>
<p>O basquete 3x3 tem uma origem diferente da maioria dos esportes olímpicos: ele nasceu nas <strong>quadras abertas das ruas</strong>. Desde o final dos anos 1980, jogadores de todo o mundo — com destaque para os Estados Unidos — se reuniam em meia quadra para partidas mais rápidas e dinâmicas, onde mais pessoas podiam participar.</p>

<p>O esporte cresceu tanto que a <strong>FIBA</strong> (Federação Internacional de Basquete) percebeu o potencial e organizou o primeiro evento teste em 2007, nos Jogos Asiáticos em Macau. Em 2010, o 3x3 estreou nos <strong>Jogos Olímpicos da Juventude</strong> em Singapura. Em 2017, o COI anunciou a inclusão nos Jogos Olímpicos. E em <strong>Tóquio 2020</strong>, o basquete 3x3 fez sua estreia olímpica histórica.</p>

<h2>As regras — simples, rápidas e emocionantes</h2>
<p>O 3x3 foi criado para ser acessível e veloz. As principais diferenças em relação ao basquete tradicional:</p>

<ul>
  <li><strong>Equipes:</strong> 3 jogadores titulares + 2 reservas (não 5)</li>
  <li><strong>Quadra:</strong> meia quadra, apenas uma cesta, 15x11 metros</li>
  <li><strong>Bola:</strong> mede 720mm e pesa 620g (ligeiramente menor)</li>
  <li><strong>Tempo de jogo:</strong> 10 minutos únicos (não 4 quartos)</li>
  <li><strong>Pontuação:</strong> arremessos dentro do arco valem 1 ponto; fora do arco valem 2 pontos</li>
  <li><strong>Vencedor:</strong> quem primeiro marcar 21 pontos ou tiver mais pontos ao final dos 10 minutos</li>
  <li><strong>Posse de bola:</strong> após cesta ou rebote defensivo, a bola precisa ser levada para fora do arco antes de atacar novamente</li>
  <li><strong>Shot clock:</strong> 12 segundos para arremessar (no lugar de 24)</li>
</ul>

<h2>Por que o 3x3 é especial</h2>
<p>O formato acelerado torna cada jogada mais intensa. Não há tempo para construir jogadas longas — a decisão precisa ser rápida. Isso valoriza atletas versáteis, com domínio completo dos fundamentos e grande capacidade individual.</p>

<p>"O Basquete 3×3 exige atletas que tenham o domínio de todos os fundamentos, onde a característica física prevalece, atrelada também à técnica", explica a treinadora da seleção brasileira feminina de 3x3 sub-18, Elen Rosa.</p>

<p>A atmosfera também é única: música, quadras urbanas, competição ao ar livre. É o esporte perfeito para atrair o público jovem e conectar a modalidade com a cultura de rua.</p>

<h2>O Brasil no 3x3</h2>
<p>O Brasil vem crescendo no cenário internacional do 3x3. A seleção masculina alcançou o <strong>4º lugar no Mundial de 2023</strong> em Viena — melhor resultado histórico do país na competição. A seleção feminina também avançou significativamente nos últimos anos.</p>

<h2>O 3x3 na FGB</h2>
<p>A <strong>Federação Gaúcha de Basketball</strong> organiza competições de basquete 3x3 no Rio Grande do Sul, levando o esporte de quadras urbanas para atletas de todas as idades. É uma porta de entrada para o basquete e uma modalidade em plena expansão no estado.</p>

<p>Se você ainda não experimentou, encontre as próximas competições 3x3 na sua região na seção de campeonatos do nosso site.</p>
`.trim(),
  },
  {
    slug: 'fgb-72-anos-de-basquete-gaucho',
    title: 'FGB: 72 anos organizando e desenvolvendo o basquete gaúcho',
    subtitle:
      'Fundada em 1952 com 22 clubes, a Federação Gaúcha de Basketball chegou à era digital com a maior plataforma de gestão de campeonatos do estado.',
    category: 'Basquete Gaúcho',
    author: 'Redação FGB',
    source: 'FGB',
    readTime: 5,
    publishedAt: '2026-05-01T12:00:00Z',
    tags: ['fgb', 'historia', 'basquete gaucho', 'rio grande do sul', '1952', 'campeonatos'],
    coverImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Rio_Grande_do_Sul_in_Brazil.svg/1200px-Rio_Grande_do_Sul_in_Brazil.svg.png',
    content: `
<h2>O nascimento: abril de 1952</h2>
<p>Em <strong>18 de abril de 1952</strong>, um grupo de apaixonados pelo basquete se reuniu em Porto Alegre com um objetivo claro: dar ao esporte no Rio Grande do Sul uma casa oficial. Nascia assim a <strong>Federação Gaúcha de Basketball (FGB)</strong>, presidida por José Carlos Daut e apoiada por <strong>22 clubes fundadores</strong>.</p>

<p>Entre os fundadores estavam nomes históricos: <strong>Grêmio Futebol Porto Alegrense, Sport Club Internacional, SOGIPA, Grêmio Náutico Gaúcho</strong> e equipes de Santa Maria, Rio Grande, Lajeado e Caxias do Sul — uma representação de todo o estado.</p>

<h2>Uma história de conquistas</h2>
<p>O basquete gaúcho já tinha tradição antes mesmo da FGB existir. Em <strong>1934 e 1935</strong>, times do Rio Grande do Sul foram bicampeões nacionais nos torneios organizados pela CBD em São Paulo. As delegações viajavam de trem — quatro dias e quatro noites — para enfrentar os paulistas e voltavam com o troféu.</p>

<p>Ao longo dos mais de 70 anos de história, a FGB organizou centenas de edições do Campeonato Gaúcho de Basquete nas categorias masculina, feminina e de base. Clubes como <strong>Caxias do Sul Basquete</strong>, SOGIPA, Recreio da Juventude e União Corinthians escreveram páginas memoráveis no estadual.</p>

<h2>As categorias de base: o futuro do basquete gaúcho</h2>
<p>Um dos pilares da FGB é o desenvolvimento de jovens atletas. A federação organiza campeonatos nas categorias <strong>Sub-12, Sub-13, Sub-14, Sub-15, Sub-16, Sub-17 e Sub-19</strong>, além do Adulto e do 3x3.</p>

<p>Esses campeonatos são a base da pirâmide do basquete gaúcho — é deles que saem os atletas que chegam ao NBB, às seleções brasileiras e até aos campeonatos internacionais. A FGB organiza tanto o Estadual Feminino quanto o Masculino, com participação de clubes de todas as regiões do estado.</p>

<h2>2026: a FGB na era digital</h2>
<p>Em 2026, a FGB deu um salto histórico na sua forma de operar. A federação passou a contar com uma <strong>plataforma digital completa</strong> para gestão de campeonatos — com Motor de Inteligência Artificial para organização automática de calendários, portal de inscrições para equipes, live stats de jogos ao vivo e carteirinhas digitais para atletas e comissão técnica.</p>

<p>A plataforma integra tudo que antes era feito em papel ou em sistemas separados: inscrições, classificações, resultados, BID de atletas, súmulas digitais e relatórios automáticos.</p>

<p>É a FGB do século XXI — mantendo a tradição de 72 anos de basquete gaúcho, mas com as ferramentas do futuro.</p>

<h2>Faça parte da história</h2>
<p>Se você tem um clube, uma equipe ou um atleta no Rio Grande do Sul, a FGB está aqui para apoiar. Acesse a área de inscrições, consulte o regulamento e junte-se às dezenas de clubes que já fazem parte da maior comunidade de basquete do estado.</p>

<blockquote>
  <p>"O basquete gaúcho tem história, tem talento e tem futuro. A FGB está aqui para garantir que cada atleta tenha a estrutura que merece."</p>
  <cite>— Federação Gaúcha de Basketball</cite>
</blockquote>
`.trim(),
  },
]

async function main() {
  await ensureDatabaseSchema(true)

  let created = 0
  let skipped = 0

  for (const a of articles) {
    const existing = await prisma.article.findUnique({ where: { slug: a.slug } })
    if (existing) {
      console.log(`↪︎  skip (already exists): ${a.slug}`)
      skipped++
      continue
    }

    await prisma.article.create({
      data: {
        slug: a.slug,
        title: a.title,
        subtitle: a.subtitle,
        category: a.category,
        author: a.author,
        source: a.source,
        sourceUrl: a.sourceUrl ?? null,
        readTime: a.readTime,
        publishedAt: new Date(a.publishedAt),
        tags: JSON.stringify(a.tags),
        coverImage: a.coverImage,
        content: a.content,
        isPublished: true,
      },
    })
    console.log(`✓  inserted: ${a.slug}`)
    created++
  }

  console.log(`\n[seed-articles] done — ${created} created, ${skipped} skipped`)
}

main()
  .catch((err) => {
    console.error('[seed-articles] failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
