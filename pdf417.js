/*  Port of pdf417.c from Zint - A barcode generating program using libpng
    Copyright (C) 2008 Robin Stuart <robin@zint.org.uk>
    Portions Copyright (C) 2004 Grandzebu
    Bug Fixes thanks to KL Chin <klchin@users.sourceforge.net>

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details: <https://www.gnu.org/licenses/>.
*/

// PDF417 encoder, a JavaScript port of the PDF417 part of the zint version this page used to
// bundle (pdf417.c), so the symbols are the same as the ones that zint/emscripten build produced:
// - text and byte compaction (this zint build never selects numeric compaction),
// - rows computed from the number of data columns, padded with 900 codewords like zint,
// - optional truncated PDF417 (no right row indicator / stop pattern) and fixed row count,
//   used by the PDF417-VJ template (Vietjet: 8 columns x 8 rows, ECC level 2, truncated).
// Rendering matches zint's SVG: 10 px per module, rows 3 modules high, no quiet zone.
"use strict"

var Pdf417 = (function() {

// codagemc from zint pdf417.c: 3 clusters x 929 codewords, 3 chars per codeword, 5 bits per char
var PATTERNS = "urAxfsypyunkxdwyozpDAulspBkeBApAseAkprAuvsxhypnkutwxgzfDAplsfBkfrApvsuxyfnkptwuwzflspsyfvspxyftwpwzfxyyrxufkxFwymzonAudsxEyolkucwdBAoksucidAkokgdAcovkuhwxazdnAotsugydlkoswugjdksosidvkoxwuizdtsowydswowjdxwoyzdwydwjofAuFsxCyodkuEwxCjclAocsuEickkocgckcckEcvAohsuayctkogwuajcssogicsgcsacxsoiycwwoijcwicyyoFkuCwxBjcdAoEsuCicckoEguCbcccoEaccEoEDchkoawuDjcgsoaicggoabcgacgDobjcibcFAoCsuBicEkoCguBbcEcoCacEEoCDcECcascagcaacCkuAroBaoBDcCBtfkwpwyezmnAtdswoymlktcwwojFBAmksFAkmvkthwwqzFnAmtstgyFlkmswFksFkgFvkmxwtizFtsmwyFswFsiFxwmyzFwyFyzvfAxpsyuyvdkxowyujqlAvcsxoiqkkvcgxobqkcvcamfAtFswmyqvAmdktEwwmjqtkvgwxqjhlAEkkmcgtEbhkkqsghkcEvAmhstayhvAEtkmgwtajhtkqwwvijhssEsghsgExsmiyhxsEwwmijhwwqyjhwiEyyhyyEyjhyjvFkxmwytjqdAvEsxmiqckvEgxmbqccvEaqcEqcCmFktCwwljqhkmEstCigtAEckvaitCbgskEccmEagscqgamEDEcCEhkmawtDjgxkEgsmaigwsqiimabgwgEgaEgDEiwmbjgywEiigyiEibgybgzjqFAvCsxliqEkvCgxlbqEcvCaqEEvCDqECqEBEFAmCstBighAEEkmCgtBbggkqagvDbggcEEEmCDggEqaDggCEasmDigisEagmDbgigqbbgiaEaDgiDgjigjbqCkvBgxkrqCcvBaqCEvBDqCCqCBECkmBgtArgakECcmBagacqDamBDgaEECCgaCECBEDggbggbagbDvAqvAnqBBmAqEBEgDEgDCgDBlfAspsweyldksowClAlcssoiCkklcgCkcCkECvAlhssqyCtklgwsqjCsslgiCsgCsaCxsliyCwwlijCwiCyyCyjtpkwuwyhjndAtoswuincktogwubncctoancEtoDlFksmwwdjnhklEssmiatACcktqismbaskngglEaascCcEasEChklawsnjaxkCgstrjawsniilabawgCgaawaCiwlbjaywCiiayiCibCjjazjvpAxusyxivokxugyxbvocxuavoExuDvoCnFAtmswtirhAnEkxviwtbrgkvqgxvbrgcnEEtmDrgEvqDnEBCFAlCssliahACEklCgslbixAagknagtnbiwkrigvrblCDiwcagEnaDiwECEBCaslDiaisCaglDbiysaignbbiygrjbCaDaiDCbiajiCbbiziajbvmkxtgywrvmcxtavmExtDvmCvmBnCktlgwsrraknCcxtrracvnatlDraEnCCraCnCBraBCCklBgskraakCCclBaiikaacnDalBDiicrbaCCCiiEaaCCCBaaBCDglBrabgCDaijgabaCDDijaabDCDrijrvlcxsqvlExsnvlCvlBnBctkqrDcnBEtknrDEvlnrDCnBBrDBCBclAqaDcCBElAnibcaDEnBnibErDnCBBibCaDBibBaDqibqibnxsfvkltkfnAmnAlCAoaBoiDoCAlaBlkpkBdAkosBckkogsebBcckoaBcEkoDBhkkqwsfjBgskqiBggkqbBgaBgDBiwkrjBiiBibBjjlpAsuswhiloksuglocsualoEsuDloCBFAkmssdiDhABEksvisdbDgklqgsvbDgcBEEkmDDgElqDBEBBaskniDisBagknbDiglrbDiaBaDBbiDjiBbbDjbtukwxgyirtucwxatuEwxDtuCtuBlmkstgnqklmcstanqctvastDnqElmCnqClmBnqBBCkklgDakBCcstrbikDaclnaklDbicnraBCCbiEDaCBCBDaBBDgklrDbgBDabjgDbaBDDbjaDbDBDrDbrbjrxxcyyqxxEyynxxCxxBttcwwqvvcxxqwwnvvExxnvvCttBvvBllcssqnncllEssnrrcnnEttnrrEvvnllBrrCnnBrrBBBckkqDDcBBEkknbbcDDEllnjjcbbEnnnBBBjjErrnDDBjjCBBqDDqBBnbbqDDnjjqbbnjjnxwoyyfxwmxwltsowwfvtoxwvvtmtslvtllkossfnlolkmrnonlmlklrnmnllrnlBAokkfDBolkvbDoDBmBAljbobDmDBljbmbDljblDBvjbvxwdvsuvstnkurlurltDAubBujDujDtApAAokkegAocAoEAoCAqsAqgAqaAqDAriArbkukkucshakuEshDkuCkuBAmkkdgBqkkvgkdaBqckvaBqEkvDBqCAmBBqBAngkdrBrgkvrBraAnDBrDAnrBrrsxcsxEsxCsxBktclvcsxqsgnlvEsxnlvCktBlvBAlcBncAlEkcnDrcBnEAlCDrEBnCAlBDrCBnBAlqBnqAlnDrqBnnDrnwyowymwylswotxowyvtxmswltxlksosgfltoswvnvoltmkslnvmltlnvlAkokcfBloksvDnoBlmAklbroDnmBllbrmDnlAkvBlvDnvbrvyzeyzdwyexyuwydxytswetwuswdvxutwtvxtkselsuksdntulstrvuypkzewxdAyoszeixckyogzebxccyoaxcEyoDxcCxhkyqwzfjutAxgsyqiuskxggyqbuscxgausExgDusCuxkxiwyrjptAuwsxiipskuwgxibpscuwapsEuwDpsCpxkuywxjjftApwsuyifskpwguybfscpwafsEpwDfxkpywuzjfwspyifwgpybfwafywpzjfyifybxFAymszdixEkymgzdbxEcymaxEEymDxECxEBuhAxasyniugkxagynbugcxaaugExaDugCugBoxAuisxbiowkuigxbbowcuiaowEuiDowCowBdxAoysujidwkoygujbdwcoyadwEoyDdwCdysozidygozbdyadyDdzidzbxCkylgzcrxCcylaxCEylDxCCxCBuakxDgylruacxDauaExDDuaCuaBoikubgxDroicubaoiEubDoiCoiBcykojgubrcycojacyEojDcyCcyBczgojrczaczDczrxBcykqxBEyknxBCxBBuDcxBquDExBnuDCuDBobcuDqobEuDnobCobBcjcobqcjEobncjCcjBcjqcjnxAoykfxAmxAluBoxAvuBmuBloDouBvoDmoDlcbooDvcbmcblxAexAduAuuAtoBuoBtwpAyeszFiwokyegzFbwocyeawoEyeDwoCwoBthAwqsyfitgkwqgyfbtgcwqatgEwqDtgCtgBmxAtiswrimwktigwrbmwctiamwEtiDmwCmwBFxAmystjiFwkmygtjbFwcmyaFwEmyDFwCFysmziFygmzbFyaFyDFziFzbyukzhghjsyuczhahbwyuEzhDhDyyuCyuBwmkydgzErxqkwmczhrxqcyvaydDxqEwmCxqCwmBxqBtakwngydrviktacwnavicxrawnDviEtaCviCtaBviBmiktbgwnrqykmictbaqycvjatbDqyEmiCqyCmiBqyBEykmjgtbrhykEycmjahycqzamjDhyEEyChyCEyBEzgmjrhzgEzahzaEzDhzDEzrytczgqgrwytEzgngnyytCglzytBwlcycqxncwlEycnxnEytnxnCwlBxnBtDcwlqvbctDEwlnvbExnnvbCtDBvbBmbctDqqjcmbEtDnqjEvbnqjCmbBqjBEjcmbqgzcEjEmbngzEqjngzCEjBgzBEjqgzqEjngznysozgfgfyysmgdzyslwkoycfxloysvxlmwklxlltBowkvvDotBmvDmtBlvDlmDotBvqbovDvqbmmDlqblEbomDvgjoEbmgjmEblgjlEbvgjvysegFzysdwkexkuwkdxkttAuvButAtvBtmBuqDumBtqDtEDugbuEDtgbtysFwkFxkhtAhvAxmAxqBxwekyFgzCrwecyFaweEyFDweCweBsqkwfgyFrsqcwfasqEwfDsqCsqBliksrgwfrlicsraliEsrDliCliBCykljgsrrCycljaCyEljDCyCCyBCzgljrCzaCzDCzryhczaqarwyhEzananyyhCalzyhBwdcyEqwvcwdEyEnwvEyhnwvCwdBwvBsncwdqtrcsnEwdntrEwvntrCsnBtrBlbcsnqnjclbEsnnnjEtrnnjClbBnjBCjclbqazcCjElbnazEnjnazCCjBazBCjqazqCjnaznzioirsrfyziminwrdzzililyikzygozafafyyxozivivyadzyxmyglitzyxlwcoyEfwtowcmxvoyxvwclxvmwtlxvlslowcvtnoslmvrotnmsllvrmtnlvrllDoslvnbolDmrjonbmlDlrjmnblrjlCbolDvajoCbmizoajmCblizmajlizlCbvajvzieifwrFzzididyiczygeaFzywuygdihzywtwcewsuwcdxtuwstxttskutlusktvnutltvntlBunDulBtrbunDtrbtCDuabuCDtijuabtijtziFiFyiEzygFywhwcFwshxsxskhtkxvlxlAxnBxrDxCBxaDxibxiCzwFcyCqwFEyCnwFCwFBsfcwFqsfEwFnsfCsfBkrcsfqkrEsfnkrCkrBBjckrqBjEkrnBjCBjBBjqBjnyaozDfDfyyamDdzyalwEoyCfwhowEmwhmwElwhlsdowEvsvosdmsvmsdlsvlknosdvlroknmlrmknllrlBboknvDjoBbmDjmBblDjlBbvDjvzbebfwnpzzbdbdybczyaeDFzyiuyadbhzyitwEewguwEdwxuwgtwxtscustuscttvustttvtklulnukltnrulntnrtBDuDbuBDtbjuDbtbjtjfsrpyjdwrozjcyjcjzbFbFyzjhjhybEzjgzyaFyihyyxwEFwghwwxxxxschssxttxvvxkkxllxnnxrrxBBxDDxbbxjFwrmzjEyjEjbCzjazjCyjCjjBjwCowCmwClsFowCvsFmsFlkfosFvkfmkflArokfvArmArlArvyDeBpzyDdwCewauwCdwatsEushusEtshtkdukvukdtkvtAnuBruAntBrtzDpDpyDozyDFybhwCFwahwixsEhsgxsxxkcxktxlvxAlxBnxDrxbpwnuzboybojDmzbqzjpsruyjowrujjoijobbmyjqybmjjqjjmwrtjjmijmbbljjnjjlijlbjkrsCusCtkFukFtAfuAftwDhsChsaxkExkhxAdxAvxBuzDuyDujbuwnxjbuibubDtjbvjjusrxijugrxbjuajuDbtijvibtbjvbjtgrwrjtajtDbsrjtrjsqjsnBxjDxiDxbbxgnyrbxabxDDwrbxrbwqbwnpjkurwejApbsunyebkpDwulzeDspByeBwzfcfjkprwzfEfbspnyzfCfDwplzzfBfByyrczfqfrwyrEzfnfnyyrCflzyrBxjcyrqxjEyrnxjCxjBuzcxjquzExjnuzCuzBpzcuzqpzEuznpzCdjAorsufydbkonwudzdDsolydBwokzdAyzdodrsovyzdmdnwotzzdldlydkzynozdvdvyynmdtzynlxboynvxbmxblujoxbvujmujlozoujvozmozlcrkofwuFzcnsodyclwoczckyckjzcucvwohzzctctycszylucxzyltxDuxDtubuubtojuojtcfsoFycdwoEzccyccjzchchycgzykxxBxuDxcFwoCzcEycEjcazcCycCjFjAmrstfyFbkmnwtdzFDsmlyFBwmkzFAyzFoFrsmvyzFmFnwmtzzFlFlyFkzyfozFvFvyyfmFtzyflwroyfvwrmwrltjowrvtjmtjlmzotjvmzmmzlqrkvfwxpzhbAqnsvdyhDkqlwvczhBsqkyhAwqkjhAiErkmfwtFzhrkEnsmdyhnsqtymczhlwEkyhkyEkjhkjzEuEvwmhzzhuzEthvwEtyzhthtyEszhszyduExzyvuydthxzyvtwnuxruwntxrttbuvjutbtvjtmjumjtgrAqfsvFygnkqdwvEzglsqcygkwqcjgkigkbEfsmFygvsEdwmEzgtwqgzgsyEcjgsjzEhEhyzgxgxyEgzgwzycxytxwlxxnxtDxvbxmbxgfkqFwvCzgdsqEygcwqEjgcigcbEFwmCzghwEEyggyEEjggjEazgizgFsqCygEwqCjgEigEbECygayECjgajgCwqBjgCigCbEBjgDjgBigBbCrklfwspzCnsldyClwlczCkyCkjzCuCvwlhzzCtCtyCszyFuCxzyFtwfuwftsrusrtljuljtarAnfstpyankndwtozalsncyakwncjakiakbCfslFyavsCdwlEzatwngzasyCcjasjzChChyzaxaxyCgzawzyExyhxwdxwvxsnxtrxlbxrfkvpwxuzinArdsvoyilkrcwvojiksrciikgrcbikaafknFwtmzivkadsnEyitsrgynEjiswaciisiacbisbCFwlCzahwCEyixwagyCEjiwyagjiwjCazaiziyzifArFsvmyidkrEwvmjicsrEiicgrEbicaicDaFsnCyihsaEwnCjigwrajigiaEbigbCCyaayCCjiiyaajiijiFkrCwvljiEsrCiiEgrCbiEaiEDaCwnBjiawaCiiaiaCbiabCBjaDjibjiCsrBiiCgrBbiCaiCDaBiiDiaBbiDbiBgrAriBaiBDaAriBriAqiAnBfskpyBdwkozBcyBcjBhyBgzyCxwFxsfxkrxDfklpwsuzDdsloyDcwlojDciDcbBFwkmzDhwBEyDgyBEjDgjBazDizbfAnpstuybdknowtujbcsnoibcgnobbcabcDDFslmybhsDEwlmjbgwDEibgiDEbbgbBCyDayBCjbiyDajbijrpkvuwxxjjdArosvuijckrogvubjccroajcEroDjcCbFknmwttjjhkbEsnmijgsrqinmbjggbEajgabEDjgDDCwlljbawDCijiwbaiDCbjiibabjibBBjDDjbbjjjjjFArmsvtijEkrmgvtbjEcrmajEErmDjECjEBbCsnlijasbCgnlbjagrnbjaabCDjaDDBibDiDBbjbibDbjbbjCkrlgvsrjCcrlajCErlDjCCjCBbBgnkrjDgbBajDabBDjDDDArbBrjDrjBcrkqjBErknjBCjBBbAqjBqbAnjBnjAorkfjAmjAlbAfjAvApwkezAoyAojAqzBpskuyBowkujBoiBobAmyBqyAmjBqjDpkluwsxjDosluiDoglubDoaDoDBmwktjDqwBmiDqiBmbDqbAljBnjDrjbpAnustxiboknugtxbbocnuaboEnuDboCboBDmsltibqsDmgltbbqgnvbbqaDmDbqDBliDniBlbbriDnbbrbrukvxgxyrrucvxaruEvxDruCruBbmkntgtwrjqkbmcntajqcrvantDjqEbmCjqCbmBjqBDlglsrbngDlajrgbnaDlDjrabnDjrDBkrDlrbnrjrrrtcvwqrtEvwnrtCrtBblcnsqjncblEnsnjnErtnjnCblBjnBDkqblqDknjnqblnjnnrsovwfrsmrslbkonsfjlobkmjlmbkljllDkfbkvjlvrsersdbkejkubkdjktAeyAejAuwkhjAuiAubAdjAvjBuskxiBugkxbBuaBuDAtiBviAtbBvbDuklxgsyrDuclxaDuElxDDuCDuBBtgkwrDvglxrDvaBtDDvDAsrBtrDvrnxctyqnxEtynnxCnxBDtclwqbvcnxqlwnbvEDtCbvCDtBbvBBsqDtqBsnbvqDtnbvnvyoxzfvymvylnwotyfrxonwmrxmnwlrxlDsolwfbtoDsmjvobtmDsljvmbtljvlBsfDsvbtvjvvvyevydnwerwunwdrwtDsebsuDsdjtubstjttvyFnwFrwhDsFbshjsxAhiAhbAxgkirAxaAxDAgrAxrBxckyqBxEkynBxCBxBAwqBxqAwnBxnlyoszflymlylBwokyfDxolyvDxmBwlDxlAwfBwvDxvtzetzdlyenyulydnytBweDwuBwdbxuDwtbxttzFlyFnyhBwFDwhbwxAiqAinAyokjfAymAylAifAyvkzekzdAyeByuAydBytszp"

var PATTERN_CHARS = "ABCDEFabcdefghijklmnopqrstuvwxyz"
var START = "1111111101010100" + "01"
var STOP = "11111101000101001"
var SEPARATOR = "01"
var MODULE_PX = 10   // the scale the old zint build used
var ROW_MODULES = 3

var TEX = 900, BYT = 901
var LATCH_TEXT = 900, PAD = 900, LATCH_BYTE = 901, LATCH_BYTE6 = 924, SHIFT_BYTE = 913

// ---------------- text compaction (textprocess) ----------------

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

function charTables(c) {
    if (c == 9) return [12, 12]
    if (c == 10) return [8, 15]
    if (c == 13) return [12, 11]
    return [ASCII_TABLES[c - 32], ASCII_VALUES[c - 32]]
}

function textProcess(bytes, out) {
    var list = bytes.map(charTables), v = [], cur = 1
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
    out.push(LATCH_TEXT)
    for (var k = 0; k < v.length; k += 2)
        out.push(v[k] * 30 + v[k + 1])
}

// ---------------- byte compaction (byteprocess) ----------------

function byteProcess(bytes, out) {
    if (bytes.length == 1) {
        out.push(SHIFT_BYTE, bytes[0])
        return
    }
    out.push(bytes.length % 6 == 0 ? LATCH_BYTE6 : LATCH_BYTE)
    var i = 0
    for (; i + 6 <= bytes.length; i += 6) {
        var total = 0  // 48 bits, exact in a double
        for (var j = 0; j < 6; j++)
            total = total * 256 + bytes[i + j]
        var cw = []
        for (var j = 0; j < 5; j++) {
            cw.unshift(total % 900)
            total = Math.floor(total / 900)
        }
        out.push.apply(out, cw)
    }
    for (; i < bytes.length; i++)
        out.push(bytes[i])
}

// ---------------- mode blocks (quelmode, pdfsmooth, regroupe) ----------------

function quelmode(c) {
    return (c == 9 || c == 10 || c == 13 || (c >= 32 && c <= 126)) ? TEX : BYT
}

function regroupe(list) {
    for (var i = 1; i < list.length; i++)
        if (list[i - 1].mode == list[i].mode) {
            list[i - 1].len += list[i].len
            list.splice(i, 1)
            i--
        }
}

function blocks(bytes) {
    var list = []
    bytes.forEach(function(c) {
        var m = quelmode(c)
        if (list.length && list[list.length - 1].mode == m)
            list[list.length - 1].len++
        else
            list.push({ mode: m, len: 1 })
    })
    // pdfsmooth: short text blocks between byte blocks become bytes
    // (its rules for numeric blocks never apply: quelmode never returns numeric)
    regroupe(list)
    for (var i = 1; i < list.length; i++) {
        var b = list[i], last = list[i - 1].mode, next = i < list.length - 1 ? list[i + 1].mode : null
        if (b.mode != TEX)
            continue
        if (i == list.length - 1) {
            if (last == BYT && b.len == 1) b.mode = BYT
        } else {
            if (last == BYT && next == BYT && b.len < 5) b.mode = BYT
            if (((last == BYT && next != BYT) || (last != BYT && next == BYT)) && b.len < 3) b.mode = BYT
        }
    }
    regroupe(list)
    return list
}

function dataCodewords(bytes) {
    var out = [], pos = 0
    blocks(bytes).forEach(function(b) {
        var part = bytes.slice(pos, pos + b.len)
        if (b.mode == TEX) textProcess(part, out)
        else byteProcess(part, out)
        pos += b.len
    })
    return out
}

// ---------------- error correction ----------------

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

// ---------------- symbol ----------------

function utf8Bytes(s) {
    var out = [], str = unescape(encodeURIComponent(s))
    for (var i = 0; i < str.length; i++)
        out.push(str.charCodeAt(i))
    return out
}

// opts: ecc (-1 auto, 0..8), cols (0 auto, 1..30), rows (fixed row count, optional),
//       truncated (bool). Returns { cols, rows, ecc, codewords } (codewords include ECC).
function encode(text, opts) {
    var cw = dataCodewords(utf8Bytes(text))
    var ecc = opts.ecc, cols = opts.cols
    if (ecc < -1 || ecc > 8) ecc = -1
    if (cols < 0 || cols > 30) cols = 0
    if (ecc < 0) {
        ecc = 6
        if (cw.length <= 863) ecc = 5
        if (cw.length <= 320) ecc = 4
        if (cw.length <= 160) ecc = 3
        if (cw.length <= 40) ecc = 2
    }
    var k = 2 << ecc
    if (cols < 1)
        cols = Math.floor(0.5 + Math.sqrt((cw.length + k) / 3))
    if (Math.floor((cw.length + k) / cols) > 90)
        cols++  // stop the symbol from becoming too high
    if (cw.length + k > 928)
        throw new Error("Dữ liệu quá dài cho PDF417")
    if (Math.floor((cw.length + k) / cols) > 90)
        throw new Error("Dữ liệu quá dài cho số cột đã chọn")

    var len = cw.length + 1 + k, pad = 0
    if (opts.rows) {
        if (len > cols * opts.rows)
            throw new Error("Dữ liệu quá dài cho mẫu này (" + (len - k) + "/" + (cols * opts.rows - k) + " codeword)")
        pad = cols * opts.rows - len
    }
    else if (Math.floor(len / cols) < 3)
        pad = cols * 3 - len  // at least three rows
    else if (len % cols)
        pad = cols - len % cols
    while (pad-- > 0)
        cw.push(PAD)
    cw.unshift(cw.length + 1)  // length descriptor
    cw = cw.concat(eccCodewords(cw, ecc))
    return { cols: cols, rows: cw.length / cols, ecc: ecc, codewords: cw }
}

function codewordBits(cluster, value) {
    var s = PATTERNS.substr((cluster * 929 + value) * 3, 3), b = ""
    for (var i = 0; i < 3; i++)
        b += (32 + PATTERN_CHARS.indexOf(s.charAt(i))).toString(2).substr(1)
    return b + SEPARATOR
}

// module rows, "1" = bar
function rowBits(sym, truncated) {
    var cols = sym.cols, rows = sym.rows, cw = sym.codewords
    var c1 = Math.floor((rows - 1) / 3), c2 = sym.ecc * 3 + (rows - 1) % 3, c3 = cols - 1
    var out = []
    for (var i = 0; i < rows; i++) {
        var k = Math.floor(i / 3) * 30, cl = i % 3
        var bits = START + codewordBits(cl, k + [c1, c2, c3][cl])
        for (var j = 0; j < cols; j++)
            bits += codewordBits(cl, cw[i * cols + j])
        if (!truncated)
            bits += codewordBits(cl, k + [c3, c1, c2][cl]) + STOP
        out.push(bits)
    }
    return out
}

function svg(text, opts) {
    var lines = rowBits(encode(text, opts), opts.truncated)
    var w = lines[0].length * MODULE_PX, rh = ROW_MODULES * MODULE_PX, h = lines.length * rh
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

return { encode: encode, rowBits: rowBits, svg: svg }
})()
