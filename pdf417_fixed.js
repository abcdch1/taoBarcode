// Fixed-size truncated PDF417 encoder.
// Used for templates whose symbol shape must not depend on the data length,
// e.g. Vietjet boarding passes: always 8 data columns x 8 rows, ECC level 2,
// text compaction, padded with 900 codewords, truncated (no right row indicator / stop pattern).
// Rendering follows zint (src/pdf417.c) so the output looks the same as the other templates.
"use strict"

var Pdf417Fixed = (function() {

// codagemc from src/pdf417.c: 3 clusters x 929 codewords, 3 chars per codeword, 5 bits per char
var PATTERNS = "urAxfsypyunkxdwyozpDAulspBkeBApAseAkprAuvsxhypnkutwxgzfDAplsfBkfrApvsuxyfnkptwuwzflspsyfvspxyftwpwzfxyyrxufkxFwymzonAudsxEyolkucwdBAoksucidAkokgdAcovkuhwxazdnAotsugydlkoswugjdksosidvkoxwuizdtsowydswowjdxwoyzdwydwjofAuFsxCyodkuEwxCjclAocsuEickkocgckcckEcvAohsuayctkogwuajcssogicsgcsacxsoiycwwoijcwicyyoFkuCwxBjcdAoEsuCicckoEguCbcccoEaccEoEDchkoawuDjcgsoaicggoabcgacgDobjcibcFAoCsuBicEkoCguBbcEcoCacEEoCDcECcascagcaacCkuAroBaoBDcCBtfkwpwyezmnAtdswoymlktcwwojFBAmksFAkmvkthwwqzFnAmtstgyFlkmswFksFkgFvkmxwtizFtsmwyFswFsiFxwmyzFwyFyzvfAxpsyuyvdkxowyujqlAvcsxoiqkkvcgxobqkcvcamfAtFswmyqvAmdktEwwmjqtkvgwxqjhlAEkkmcgtEbhkkqsghkcEvAmhstayhvAEtkmgwtajhtkqwwvijhssEsghsgExsmiyhxsEwwmijhwwqyjhwiEyyhyyEyjhyjvFkxmwytjqdAvEsxmiqckvEgxmbqccvEaqcEqcCmFktCwwljqhkmEstCigtAEckvaitCbgskEccmEagscqgamEDEcCEhkmawtDjgxkEgsmaigwsqiimabgwgEgaEgDEiwmbjgywEiigyiEibgybgzjqFAvCsxliqEkvCgxlbqEcvCaqEEvCDqECqEBEFAmCstBighAEEkmCgtBbggkqagvDbggcEEEmCDggEqaDggCEasmDigisEagmDbgigqbbgiaEaDgiDgjigjbqCkvBgxkrqCcvBaqCEvBDqCCqCBECkmBgtArgakECcmBagacqDamBDgaEECCgaCECBEDggbggbagbDvAqvAnqBBmAqEBEgDEgDCgDBlfAspsweyldksowClAlcssoiCkklcgCkcCkECvAlhssqyCtklgwsqjCsslgiCsgCsaCxsliyCwwlijCwiCyyCyjtpkwuwyhjndAtoswuincktogwubncctoancEtoDlFksmwwdjnhklEssmiatACcktqismbaskngglEaascCcEasEChklawsnjaxkCgstrjawsniilabawgCgaawaCiwlbjaywCiiayiCibCjjazjvpAxusyxivokxugyxbvocxuavoExuDvoCnFAtmswtirhAnEkxviwtbrgkvqgxvbrgcnEEtmDrgEvqDnEBCFAlCssliahACEklCgslbixAagknagtnbiwkrigvrblCDiwcagEnaDiwECEBCaslDiaisCaglDbiysaignbbiygrjbCaDaiDCbiajiCbbiziajbvmkxtgywrvmcxtavmExtDvmCvmBnCktlgwsrraknCcxtrracvnatlDraEnCCraCnCBraBCCklBgskraakCCclBaiikaacnDalBDiicrbaCCCiiEaaCCCBaaBCDglBrabgCDaijgabaCDDijaabDCDrijrvlcxsqvlExsnvlCvlBnBctkqrDcnBEtknrDEvlnrDCnBBrDBCBclAqaDcCBElAnibcaDEnBnibErDnCBBibCaDBibBaDqibqibnxsfvkltkfnAmnAlCAoaBoiDoCAlaBlkpkBdAkosBckkogsebBcckoaBcEkoDBhkkqwsfjBgskqiBggkqbBgaBgDBiwkrjBiiBibBjjlpAsuswhiloksuglocsualoEsuDloCBFAkmssdiDhABEksvisdbDgklqgsvbDgcBEEkmDDgElqDBEBBaskniDisBagknbDiglrbDiaBaDBbiDjiBbbDjbtukwxgyirtucwxatuEwxDtuCtuBlmkstgnqklmcstanqctvastDnqElmCnqClmBnqBBCkklgDakBCcstrbikDaclnaklDbicnraBCCbiEDaCBCBDaBBDgklrDbgBDabjgDbaBDDbjaDbDBDrDbrbjrxxcyyqxxEyynxxCxxBttcwwqvvcxxqwwnvvExxnvvCttBvvBllcssqnncllEssnrrcnnEttnrrEvvnllBrrCnnBrrBBBckkqDDcBBEkknbbcDDEllnjjcbbEnnnBBBjjErrnDDBjjCBBqDDqBBnbbqDDnjjqbbnjjnxwoyyfxwmxwltsowwfvtoxwvvtmtslvtllkossfnlolkmrnonlmlklrnmnllrnlBAokkfDBolkvbDoDBmBAljbobDmDBljbmbDljblDBvjbvxwdvsuvstnkurlurltDAubBujDujDtApAAokkegAocAoEAoCAqsAqgAqaAqDAriArbkukkucshakuEshDkuCkuBAmkkdgBqkkvgkdaBqckvaBqEkvDBqCAmBBqBAngkdrBrgkvrBraAnDBrDAnrBrrsxcsxEsxCsxBktclvcsxqsgnlvEsxnlvCktBlvBAlcBncAlEkcnDrcBnEAlCDrEBnCAlBDrCBnBAlqBnqAlnDrqBnnDrnwyowymwylswotxowyvtxmswltxlksosgfltoswvnvoltmkslnvmltlnvlAkokcfBloksvDnoBlmAklbroDnmBllbrmDnlAkvBlvDnvbrvyzeyzdwyexyuwydxytswetwuswdvxutwtvxtkselsuksdntulstrvuypkzewxdAyoszeixckyogzebxccyoaxcEyoDxcCxhkyqwzfjutAxgsyqiuskxggyqbuscxgausExgDusCuxkxiwyrjptAuwsxiipskuwgxibpscuwapsEuwDpsCpxkuywxjjftApwsuyifskpwguybfscpwafsEpwDfxkpywuzjfwspyifwgpybfwafywpzjfyifybxFAymszdixEkymgzdbxEcymaxEEymDxECxEBuhAxasyniugkxagynbugcxaaugExaDugCugBoxAuisxbiowkuigxbbowcuiaowEuiDowCowBdxAoysujidwkoygujbdwcoyadwEoyDdwCdysozidygozbdyadyDdzidzbxCkylgzcrxCcylaxCEylDxCCxCBuakxDgylruacxDauaExDDuaCuaBoikubgxDroicubaoiEubDoiCoiBcykojgubrcycojacyEojDcyCcyBczgojrczaczDczrxBcykqxBEyknxBCxBBuDcxBquDExBnuDCuDBobcuDqobEuDnobCobBcjcobqcjEobncjCcjBcjqcjnxAoykfxAmxAluBoxAvuBmuBloDouBvoDmoDlcbooDvcbmcblxAexAduAuuAtoBuoBtwpAyeszFiwokyegzFbwocyeawoEyeDwoCwoBthAwqsyfitgkwqgyfbtgcwqatgEwqDtgCtgBmxAtiswrimwktigwrbmwctiamwEtiDmwCmwBFxAmystjiFwkmygtjbFwcmyaFwEmyDFwCFysmziFygmzbFyaFyDFziFzbyukzhghjsyuczhahbwyuEzhDhDyyuCyuBwmkydgzErxqkwmczhrxqcyvaydDxqEwmCxqCwmBxqBtakwngydrviktacwnavicxrawnDviEtaCviCtaBviBmiktbgwnrqykmictbaqycvjatbDqyEmiCqyCmiBqyBEykmjgtbrhykEycmjahycqzamjDhyEEyChyCEyBEzgmjrhzgEzahzaEzDhzDEzrytczgqgrwytEzgngnyytCglzytBwlcycqxncwlEycnxnEytnxnCwlBxnBtDcwlqvbctDEwlnvbExnnvbCtDBvbBmbctDqqjcmbEtDnqjEvbnqjCmbBqjBEjcmbqgzcEjEmbngzEqjngzCEjBgzBEjqgzqEjngznysozgfgfyysmgdzyslwkoycfxloysvxlmwklxlltBowkvvDotBmvDmtBlvDlmDotBvqbovDvqbmmDlqblEbomDvgjoEbmgjmEblgjlEbvgjvysegFzysdwkexkuwkdxkttAuvButAtvBtmBuqDumBtqDtEDugbuEDtgbtysFwkFxkhtAhvAxmAxqBxwekyFgzCrwecyFaweEyFDweCweBsqkwfgyFrsqcwfasqEwfDsqCsqBliksrgwfrlicsraliEsrDliCliBCykljgsrrCycljaCyEljDCyCCyBCzgljrCzaCzDCzryhczaqarwyhEzananyyhCalzyhBwdcyEqwvcwdEyEnwvEyhnwvCwdBwvBsncwdqtrcsnEwdntrEwvntrCsnBtrBlbcsnqnjclbEsnnnjEtrnnjClbBnjBCjclbqazcCjElbnazEnjnazCCjBazBCjqazqCjnaznzioirsrfyziminwrdzzililyikzygozafafyyxozivivyadzyxmyglitzyxlwcoyEfwtowcmxvoyxvwclxvmwtlxvlslowcvtnoslmvrotnmsllvrmtnlvrllDoslvnbolDmrjonbmlDlrjmnblrjlCbolDvajoCbmizoajmCblizmajlizlCbvajvzieifwrFzzididyiczygeaFzywuygdihzywtwcewsuwcdxtuwstxttskutlusktvnutltvntlBunDulBtrbunDtrbtCDuabuCDtijuabtijtziFiFyiEzygFywhwcFwshxsxskhtkxvlxlAxnBxrDxCBxaDxibxiCzwFcyCqwFEyCnwFCwFBsfcwFqsfEwFnsfCsfBkrcsfqkrEsfnkrCkrBBjckrqBjEkrnBjCBjBBjqBjnyaozDfDfyyamDdzyalwEoyCfwhowEmwhmwElwhlsdowEvsvosdmsvmsdlsvlknosdvlroknmlrmknllrlBboknvDjoBbmDjmBblDjlBbvDjvzbebfwnpzzbdbdybczyaeDFzyiuyadbhzyitwEewguwEdwxuwgtwxtscustuscttvustttvtklulnukltnrulntnrtBDuDbuBDtbjuDbtbjtjfsrpyjdwrozjcyjcjzbFbFyzjhjhybEzjgzyaFyihyyxwEFwghwwxxxxschssxttxvvxkkxllxnnxrrxBBxDDxbbxjFwrmzjEyjEjbCzjazjCyjCjjBjwCowCmwClsFowCvsFmsFlkfosFvkfmkflArokfvArmArlArvyDeBpzyDdwCewauwCdwatsEushusEtshtkdukvukdtkvtAnuBruAntBrtzDpDpyDozyDFybhwCFwahwixsEhsgxsxxkcxktxlvxAlxBnxDrxbpwnuzboybojDmzbqzjpsruyjowrujjoijobbmyjqybmjjqjjmwrtjjmijmbbljjnjjlijlbjkrsCusCtkFukFtAfuAftwDhsChsaxkExkhxAdxAvxBuzDuyDujbuwnxjbuibubDtjbvjjusrxijugrxbjuajuDbtijvibtbjvbjtgrwrjtajtDbsrjtrjsqjsnBxjDxiDxbbxgnyrbxabxDDwrbxrbwqbwnpjkurwejApbsunyebkpDwulzeDspByeBwzfcfjkprwzfEfbspnyzfCfDwplzzfBfByyrczfqfrwyrEzfnfnyyrCflzyrBxjcyrqxjEyrnxjCxjBuzcxjquzExjnuzCuzBpzcuzqpzEuznpzCdjAorsufydbkonwudzdDsolydBwokzdAyzdodrsovyzdmdnwotzzdldlydkzynozdvdvyynmdtzynlxboynvxbmxblujoxbvujmujlozoujvozmozlcrkofwuFzcnsodyclwoczckyckjzcucvwohzzctctycszylucxzyltxDuxDtubuubtojuojtcfsoFycdwoEzccyccjzchchycgzykxxBxuDxcFwoCzcEycEjcazcCycCjFjAmrstfyFbkmnwtdzFDsmlyFBwmkzFAyzFoFrsmvyzFmFnwmtzzFlFlyFkzyfozFvFvyyfmFtzyflwroyfvwrmwrltjowrvtjmtjlmzotjvmzmmzlqrkvfwxpzhbAqnsvdyhDkqlwvczhBsqkyhAwqkjhAiErkmfwtFzhrkEnsmdyhnsqtymczhlwEkyhkyEkjhkjzEuEvwmhzzhuzEthvwEtyzhthtyEszhszyduExzyvuydthxzyvtwnuxruwntxrttbuvjutbtvjtmjumjtgrAqfsvFygnkqdwvEzglsqcygkwqcjgkigkbEfsmFygvsEdwmEzgtwqgzgsyEcjgsjzEhEhyzgxgxyEgzgwzycxytxwlxxnxtDxvbxmbxgfkqFwvCzgdsqEygcwqEjgcigcbEFwmCzghwEEyggyEEjggjEazgizgFsqCygEwqCjgEigEbECygayECjgajgCwqBjgCigCbEBjgDjgBigBbCrklfwspzCnsldyClwlczCkyCkjzCuCvwlhzzCtCtyCszyFuCxzyFtwfuwftsrusrtljuljtarAnfstpyankndwtozalsncyakwncjakiakbCfslFyavsCdwlEzatwngzasyCcjasjzChChyzaxaxyCgzawzyExyhxwdxwvxsnxtrxlbxrfkvpwxuzinArdsvoyilkrcwvojiksrciikgrcbikaafknFwtmzivkadsnEyitsrgynEjiswaciisiacbisbCFwlCzahwCEyixwagyCEjiwyagjiwjCazaiziyzifArFsvmyidkrEwvmjicsrEiicgrEbicaicDaFsnCyihsaEwnCjigwrajigiaEbigbCCyaayCCjiiyaajiijiFkrCwvljiEsrCiiEgrCbiEaiEDaCwnBjiawaCiiaiaCbiabCBjaDjibjiCsrBiiCgrBbiCaiCDaBiiDiaBbiDbiBgrAriBaiBDaAriBriAqiAnBfskpyBdwkozBcyBcjBhyBgzyCxwFxsfxkrxDfklpwsuzDdsloyDcwlojDciDcbBFwkmzDhwBEyDgyBEjDgjBazDizbfAnpstuybdknowtujbcsnoibcgnobbcabcDDFslmybhsDEwlmjbgwDEibgiDEbbgbBCyDayBCjbiyDajbijrpkvuwxxjjdArosvuijckrogvubjccroajcEroDjcCbFknmwttjjhkbEsnmijgsrqinmbjggbEajgabEDjgDDCwlljbawDCijiwbaiDCbjiibabjibBBjDDjbbjjjjjFArmsvtijEkrmgvtbjEcrmajEErmDjECjEBbCsnlijasbCgnlbjagrnbjaabCDjaDDBibDiDBbjbibDbjbbjCkrlgvsrjCcrlajCErlDjCCjCBbBgnkrjDgbBajDabBDjDDDArbBrjDrjBcrkqjBErknjBCjBBbAqjBqbAnjBnjAorkfjAmjAlbAfjAvApwkezAoyAojAqzBpskuyBowkujBoiBobAmyBqyAmjBqjDpkluwsxjDosluiDoglubDoaDoDBmwktjDqwBmiDqiBmbDqbAljBnjDrjbpAnustxiboknugtxbbocnuaboEnuDboCboBDmsltibqsDmgltbbqgnvbbqaDmDbqDBliDniBlbbriDnbbrbrukvxgxyrrucvxaruEvxDruCruBbmkntgtwrjqkbmcntajqcrvantDjqEbmCjqCbmBjqBDlglsrbngDlajrgbnaDlDjrabnDjrDBkrDlrbnrjrrrtcvwqrtEvwnrtCrtBblcnsqjncblEnsnjnErtnjnCblBjnBDkqblqDknjnqblnjnnrsovwfrsmrslbkonsfjlobkmjlmbkljllDkfbkvjlvrsersdbkejkubkdjktAeyAejAuwkhjAuiAubAdjAvjBuskxiBugkxbBuaBuDAtiBviAtbBvbDuklxgsyrDuclxaDuElxDDuCDuBBtgkwrDvglxrDvaBtDDvDAsrBtrDvrnxctyqnxEtynnxCnxBDtclwqbvcnxqlwnbvEDtCbvCDtBbvBBsqDtqBsnbvqDtnbvnvyoxzfvymvylnwotyfrxonwmrxmnwlrxlDsolwfbtoDsmjvobtmDsljvmbtljvlBsfDsvbtvjvvvyevydnwerwunwdrwtDsebsuDsdjtubstjttvyFnwFrwhDsFbshjsxAhiAhbAxgkirAxaAxDAgrAxrBxckyqBxEkynBxCBxBAwqBxqAwnBxnlyoszflymlylBwokyfDxolyvDxmBwlDxlAwfBwvDxvtzetzdlyenyulydnytBweDwuBwdbxuDwtbxttzFlyFnyhBwFDwhbwxAiqAinAyokjfAymAylAifAyvkzekzdAyeByuAydBytszp"
var PATTERN_CHARS = "ABCDEFabcdefghijklmnopqrstuvwxyz"
var START = "1111111101010100" + "01"
var SEPARATOR = "01"
var MODULE_PX = 10   // same as my_symbol->scale in main.cpp
var ROW_MODULES = 3

var LATCH_TEXT = 900, PAD = 900

// Text compaction, ported from textprocess() in src/pdf417.c so the codewords are the
// same as zint's (and as Vietjet's own boarding passes).
// Sub-mode tables: 1 upper, 2 lower, 4 mixed, 8 punctuation. ASCII_TABLES is a bit mask of
// the tables each character (32..126) belongs to, ASCII_VALUES its value in those tables.
var ASCII_TABLES = [7, 8, 8, 4, 12, 4, 4, 8, 8, 8, 12, 4, 12, 12, 12, 12, 4, 4, 4, 4, 4, 4, 4, 4,
    4, 4, 12, 8, 8, 4, 8, 8, 8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 8, 8, 8, 4, 8, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 8, 8, 8, 8]
var ASCII_VALUES = [26, 10, 20, 15, 18, 21, 10, 28, 23, 24, 22, 20, 13, 16, 17, 19, 0, 1, 2, 3,
    4, 5, 6, 7, 8, 9, 14, 0, 1, 23, 2, 25, 3, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 4, 5, 6, 24, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 21, 27, 9]
// latch codes from table -> table
var SWITCH = {
    1: { 2: [27], 4: [28], 8: [28, 25] },
    2: { 1: [28, 28], 4: [28], 8: [28, 25] },
    4: { 1: [28], 2: [27], 8: [25] },
    8: { 1: [29], 2: [29, 27], 4: [29, 28] }
}

function charTables(s, i) {
    var c = s.charCodeAt(i)
    if (c == 9) return [12, 12]
    if (c == 10) return [8, 15]
    if (c == 13) return [12, 11]
    if (c < 32 || c > 126)
        throw new Error('Ký tự "' + s.charAt(i) + '" (vị trí ' + (i + 1) + ') không mã hóa được trong mẫu này')
    return [ASCII_TABLES[c - 32], ASCII_VALUES[c - 32]]
}

function textCompaction(s) {
    var list = [], v = [], cur = 1
    for (var i = 0; i < s.length; i++)
        list.push(charTables(s, i))
    for (var j = 0; j < list.length; j++) {
        var t = list[j][0], val = list[j][1]
        if (t & cur) {
            v.push(val)
            continue
        }
        var next = j + 1 < list.length ? list[j + 1][0] : 0
        // only this one character needs another table: try a one-character shift
        if (j == list.length - 1 || !(t & next)) {
            if ((t & 1) && cur == 2) { v.push(27, val); continue }
            if (t & 8) { v.push(29, val); continue }
        }
        var nt = (j < list.length - 1 && (t & next)) ? (t & next) : t
        // keep the first table if several are possible
        nt = (nt & 1) ? 1 : (nt & 2) ? 2 : (nt & 4) ? 4 : 8
        v = v.concat(SWITCH[cur][nt])
        cur = nt
        v.push(val)
    }
    if (v.length % 2)
        v.push(29)
    var cw = []
    for (var k = 0; k < v.length; k += 2)
        cw.push(v[k] * 30 + v[k + 1])
    return cw
}

// Reed-Solomon over GF(929), generator (x - 3)(x - 3^2)...(x - 3^k)
function eccCoefficients(k) {
    var g = [1], p = 1
    for (var i = 1; i <= k; i++) {
        p = (p * 3) % 929
        var n = new Array(g.length + 1).fill(0)
        for (var j = 0; j < g.length; j++) {
            n[j + 1] = (n[j + 1] + g[j]) % 929
            n[j] = (n[j] + 929 - (g[j] * p) % 929) % 929
        }
        g = n
    }
    return g.slice(0, k)  // low order first, leading 1 dropped
}

function eccCodewords(data, level) {
    var k = 2 << level, coef = eccCoefficients(k), e = new Array(k).fill(0)
    data.forEach(function(d) {
        var t = (d + e[k - 1]) % 929
        for (var j = k - 1; j > 0; j--)
            e[j] = (e[j - 1] + 929 - (t * coef[j]) % 929) % 929
        e[0] = (929 - (t * coef[0]) % 929) % 929
    })
    var out = []
    for (var i = k - 1; i >= 0; i--)
        out.push(e[i] ? 929 - e[i] : 0)
    return out
}

// all codewords of the symbol: length descriptor, latch, text, padding, ECC
function codewords(text, cols, rows, level) {
    var slots = cols * rows - (2 << level)
    var data = [0, LATCH_TEXT].concat(textCompaction(text))
    if (data.length > slots)
        throw new Error("Dữ liệu quá dài cho mẫu này (" + data.length + "/" + slots + " codeword)")
    while (data.length < slots)
        data.push(PAD)
    data[0] = slots
    return data.concat(eccCodewords(data, level))
}

function codewordBits(cluster, value) {
    var s = PATTERNS.substr((cluster * 929 + value) * 3, 3), b = ""
    for (var i = 0; i < 3; i++)
        b += (32 + PATTERN_CHARS.indexOf(s.charAt(i))).toString(2).substr(1)
    return b + SEPARATOR
}

function rowBits(cw, cols, rows, level) {
    var c1 = Math.floor((rows - 1) / 3), c2 = level * 3 + (rows - 1) % 3, c3 = cols - 1
    var out = []
    for (var i = 0; i < rows; i++) {
        var k = Math.floor(i / 3) * 30
        var left = k + [c1, c2, c3][i % 3]
        var bits = START + codewordBits(i % 3, left)
        for (var j = 0; j < cols; j++)
            bits += codewordBits(i % 3, cw[i * cols + j])
        out.push(bits)
    }
    return out
}

function svg(text, cols, rows, level) {
    var lines = rowBits(codewords(text, cols, rows, level), cols, rows, level)
    var w = lines[0].length * MODULE_PX, rh = ROW_MODULES * MODULE_PX, h = rows * rh
    var s = '<svg width="' + w + '" height="' + h + '" version="1.1" xmlns="http://www.w3.org/2000/svg">\n'
          + '<g id="barcode" fill="#000000">\n'
          + '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="#FFFFFF" />\n'
    lines.forEach(function(b, r) {
        var re = /1+/g, m
        while ((m = re.exec(b)))
            s += '<rect x="' + m.index * MODULE_PX + '" y="' + r * rh + '" width="' + m[0].length * MODULE_PX
               + '" height="' + rh + '" />\n'
    })
    return s + '</g>\n</svg>\n'
}

return { codewords: codewords, rowBits: rowBits, svg: svg }
})()
